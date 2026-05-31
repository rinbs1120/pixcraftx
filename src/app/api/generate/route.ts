import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Style-specific prompt modifiers
const STYLE_PROMPTS = {
  kids: {
    prefix: "coloring book page for children, black and white line drawing only, bold thick outlines, simple shapes, clean line art, pure black ink on white paper,",
    suffix: ", strictly monochrome, absolutely no colors, no shading, no grayscale, no filled areas, no shadows, white background, large areas to color, cartoon style outline only"
  },
  mandala: {
    prefix: "coloring book page, black and white mandala pattern, pure black ink line drawing on white paper, symmetrical circular pattern, intricate line art,",
    suffix: ", strictly monochrome, absolutely no colors, no shading, no grayscale, no filled areas, white background, zen pattern, repetitive geometric shapes outline only"
  },
  detailed: {
    prefix: "coloring book page for adults, black and white line drawing only, fine lines, intricate details, pure black ink on white paper, professional illustration outline,",
    suffix: ", strictly monochrome, absolutely no colors, no shading, no grayscale, no filled areas, no shadows, white background, complex elaborate design outline only"
  }
};

const PLAN_LIMITS = {
  free: 5,
  starter: 100,
  pro: 500,
  business: 2000,
};

// Creem Moderation API - screens user prompts before AI generation
// Required by Creem for all AI image/video generation products (effective May 1, 2026)
async function moderatePrompt(prompt: string, externalId?: string): Promise<'allow' | 'flag' | 'deny'> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    console.warn('[Moderation] CREEM_API_KEY not set, skipping moderation');
    return 'allow'; // Fail open only if key not configured yet (dev mode)
  }

  try {
    const baseUrl = apiKey.startsWith('creem_test_')
      ? 'https://test-api.creem.io'
      : 'https://api.creem.io';

    const res = await fetch(`${baseUrl}/v1/moderation/prompt`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        ...(externalId ? { external_id: externalId } : {}),
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!res.ok) {
      console.error(`[Moderation] API returned ${res.status}`);
      // FAIL CLOSED: if moderation API errors, block generation
      return 'deny';
    }

    const data = await res.json();
    console.log(`[Moderation] Decision: ${data.decision} for prompt: "${prompt.slice(0, 50)}..."`);
    return data.decision; // 'allow', 'flag', or 'deny'
  } catch (err) {
    console.error('[Moderation] Error:', err);
    // FAIL CLOSED: if moderation API fails (timeout, network error), block generation
    return 'deny';
  }
}

export async function POST(req: NextRequest) {
  try {
    fal.config({ credentials: process.env.FAL_KEY! });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify user identity
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to generate coloring pages' }, { status: 401 });
    }

    // 2. Get request parameters
    const { prompt, style = 'kids' } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a description' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
    }

    // 3. Creem Content Moderation - REQUIRED before any AI generation
    // Screens user prompt against content policies (violence, CSAM, hate, etc.)
    const moderationDecision = await moderatePrompt(prompt.trim(), `user_${userId}`);
    if (moderationDecision === 'deny' || moderationDecision === 'flag') {
      return NextResponse.json(
        { error: 'Your prompt could not be processed. Please revise and try again.' },
        { status: 400 }
      );
    }

    // 4. Check user plan limits
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    let plan = 'free';
    if (subData && subData.status === 'active') {
      plan = subData.plan || 'free';
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('pages_used')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const pagesUsed = usageData?.pages_used || 0;
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 5;

    if (pagesUsed >= limit) {
      return NextResponse.json({
        error: 'Monthly limit reached',
        limit,
        used: pagesUsed,
        plan
      }, { status: 429 });
    }

    // 5. Build coloring page specific prompt
    const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.kids;
    const fullPrompt = `${styleConfig.prefix} ${prompt.trim()} ${styleConfig.suffix}`;

    // 6. Call Fal.ai to generate image
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'portrait_4_3',
        num_images: 1,
      },
    });

    const tempImageUrl = result.data?.images?.[0]?.url;
    if (!tempImageUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // 7. Download and upload to Supabase Storage
    const imageResponse = await fetch(tempImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    const timestamp = Date.now();
    const filePath = `${userId}/${style}-${timestamp}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('coloring-pages')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Storage] Upload failed:', uploadError);
      return NextResponse.json({
        imageUrl: tempImageUrl,
        style,
        pagesUsed: pagesUsed + 1,
        limit,
        plan,
        storageWarning: 'Image stored temporarily, may expire',
      });
    }

    const { data: urlData } = supabase.storage
      .from('coloring-pages')
      .getPublicUrl(filePath);

    const permanentUrl = urlData.publicUrl;

    // 8. Update user usage
    if (usageData) {
      await supabase
        .from('user_usage')
        .update({ pages_used: pagesUsed + 1, plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('month', currentMonth);
    } else {
      await supabase
        .from('user_usage')
        .insert({ user_id: userId, month: currentMonth, pages_used: 1, plan });
    }

    // 9. Log generation history
    await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        prompt: prompt.trim(),
        style,
        image_url: permanentUrl,
        storage_path: filePath,
      });

    // 10. Return result
    return NextResponse.json({
      imageUrl: permanentUrl,
      style,
      pagesUsed: pagesUsed + 1,
      limit,
      plan,
    });

  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
