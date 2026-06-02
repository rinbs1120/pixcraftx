// Extend API route timeout for image generation (especially with ControlNet)
export const maxDuration = 60; // 60 seconds max
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Style-specific prompt modifiers
// Key requirement: ALL outlines must be fully closed for flood-fill coloring
const STYLE_PROMPTS = {
  simple: {
    prefix: "vector line art coloring page, bold thick black outlines minimum 3pt weight, pure black ink on white paper, clean closed contours, complete line borders, simple shapes with large areas to color, isolated subject on plain white background,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no shadows, no gradients, white background, cartoon style outline only, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  },
  mandala: {
    prefix: "vector line art coloring page, symmetrical mandala pattern, pure black ink on white paper, consistent medium line weight, clean closed contours, complete line borders, circular geometric design,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no gradients, white background, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  },
  intricate: {
    prefix: "vector line art coloring page for adults, fine detailed black outlines, intricate patterns, pure black ink on white paper, professional illustration, clean closed contours, complete line borders, distinct separated elements,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no shadows, no gradients, white background, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders including all background elements like trees mountains clouds, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  }
};

const PLAN_LIMITS = {
  free: 5,
  starter: 100,
  pro: 500,
  business: 2000,
};

// Trial period: image reference costs 2 credits (normally 3)
// Expires 2026-09-01, after which it reverts to 3
const TRIAL_END = new Date('2026-09-01T00:00:00Z');
const REFERENCE_COST_NORMAL = 3;
const REFERENCE_COST_TRIAL = 2;
function getReferenceCost(): number {
  return new Date() < TRIAL_END ? REFERENCE_COST_TRIAL : REFERENCE_COST_NORMAL;
}

// Creem Moderation API - screens user prompts before AI generation
async function moderatePrompt(prompt: string, externalId?: string): Promise<'allow' | 'flag' | 'deny'> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    console.warn('[Moderation] CREEM_API_KEY not set, skipping moderation');
    return 'allow';
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
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error(`[Moderation] API returned ${res.status}`);
      return 'deny';
    }

    const data = await res.json();
    console.log(`[Moderation] Decision: ${data.decision} for prompt: "${prompt.slice(0, 50)}..."`);
    return data.decision;
  } catch (err) {
    console.error('[Moderation] Error:', err);
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
    let prompt = '';
    let style = 'simple';
    let referenceImageUrl: string | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      prompt = (formData.get('prompt') as string || '').trim();
      style = (formData.get('style') as string || 'simple');
      referenceImageUrl = formData.get('referenceImageUrl') as string || null;
    } else {
      const body = await req.json();
      prompt = (body.prompt || '').trim();
      style = body.style || 'simple';
      referenceImageUrl = body.referenceImageUrl || null;
    }

    if (!prompt || prompt.length === 0) {
      return NextResponse.json({ error: 'Please enter a description' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
    }

    // 3. Creem Content Moderation
    const moderationDecision = await moderatePrompt(prompt, `user_${userId}`);
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
    const creditCost = referenceImageUrl ? getReferenceCost() : 1;

    if (pagesUsed + creditCost > limit) {
      return NextResponse.json({
        error: 'Not enough credits',
        limit,
        used: pagesUsed,
        needed: creditCost,
        plan
      }, { status: 429 });
    }

    // 5. Build coloring page specific prompt
    const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.simple;
    let fullPrompt: string;
    if (referenceImageUrl) {
      // Reference image mode: Recraft v3 line_art style natively produces B&W line art
      // The model's line_art style handles color removal at architecture level
      fullPrompt = `${styleConfig.prefix} ${prompt}, following the structure and composition of the reference image ${styleConfig.suffix}`;
    } else {
      fullPrompt = `${styleConfig.prefix} ${prompt} ${styleConfig.suffix}`;
    }

    console.log(`[Generate] Style: ${style}, Has reference: ${!!referenceImageUrl}, Prompt: "${prompt.slice(0, 80)}..."`);

    // 6. Call Fal.ai to generate image
    let result: any;

    if (referenceImageUrl) {
      // Reference image: use Recraft v3 with native line_art style
      // Recraft's vector_illustration/line_art is purpose-built for clean B&W line art,
      // architecturally preventing color bleeding - no ControlNet hacks needed!
      // Cost: $0.08/image (vector style = 2x raster $0.04)
      console.log('[Generate] Using Recraft v3 line_art for reference image');
      result = await fal.subscribe('fal-ai/recraft/v3/image-to-image', {
        input: {
          prompt: fullPrompt,
          image_url: referenceImageUrl,
          strength: 0.7,
          style: 'vector_illustration/line_art',
          negative_prompt: 'color, shading, shadow, gradient, gray fill, paint, realistic photograph',
        },
      });
    } else {
      // Text-to-image using flux/schnell (faster, cheaper)
      result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: fullPrompt,
          image_size: 'portrait_4_3',
          num_images: 1,
        },
      });
    }

    const tempImageUrl = result.data?.images?.[0]?.url;
    if (!tempImageUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // 7. Try to download and upload to Supabase Storage
    let permanentUrl = tempImageUrl;
    let storagePath: string | null = null;
    let storageFailed = false;

    try {
      const imageResponse = await fetch(tempImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      const timestamp = Date.now();
      const responseContentType = imageResponse.headers.get('content-type') || 'image/png';
      const fileExt = responseContentType.includes('webp') ? 'webp' : 'png';
      const filePath = `${userId}/${style}-${timestamp}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('coloring-pages')
        .upload(filePath, imageBuffer, {
          contentType: responseContentType,
          upsert: false,
        });

      if (uploadError) {
        console.error('[Storage] Upload failed:', uploadError);
        storageFailed = true;
      } else {
        const { data: urlData } = supabase.storage
          .from('coloring-pages')
          .getPublicUrl(filePath);
        permanentUrl = urlData.publicUrl;
        storagePath = filePath;
      }
    } catch (storageErr) {
      console.error('[Storage] Upload exception:', storageErr);
      storageFailed = true;
    }

    // 8. Update user usage - ALWAYS deduct credits even if storage fails
    if (usageData) {
      await supabase
        .from('user_usage')
        .update({ pages_used: pagesUsed + creditCost, plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('month', currentMonth);
    } else {
      await supabase
        .from('user_usage')
        .insert({ user_id: userId, month: currentMonth, pages_used: creditCost, plan });
    }

    // 9. Log generation history - ALWAYS log even if storage failed
    await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        prompt: prompt,
        style,
        image_url: permanentUrl,
        storage_path: storagePath,
        credit_cost: creditCost,
        has_reference: !!referenceImageUrl,
      });

    // 10. Return result
    return NextResponse.json({
      imageUrl: permanentUrl,
      style,
      pagesUsed: pagesUsed + creditCost,
      limit,
      plan,
      creditCost,
      hasReference: !!referenceImageUrl,
      ...(storageFailed ? { storageWarning: 'Image stored temporarily, may expire' } : {}),
    });

  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
