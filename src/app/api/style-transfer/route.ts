// Style Transfer API - Transform a coloring page into styled artwork
// V2: Uses image-to-image (flux/dev) for composition-preserving style transfer
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    fal.config({ credentials: process.env.FAL_KEY! });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to use style transfer' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, stylePrompt, styleId, strength } = body;

    if (!stylePrompt) {
      return NextResponse.json({ error: 'Missing stylePrompt' }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl - a source image is required for style transfer' }, { status: 400 });
    }

    // Check usage limits (style transfer costs 3 credits - flux/dev img2img ~$0.03)
    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = (PLAN_LIMITS[plan] || 2) + bonusCredits;

    if (pagesUsed + 3 > limit) {
      return NextResponse.json({ error: 'Not enough credits for style transfer', limit, used: pagesUsed, needed: 3 }, { status: 429 });
    }

    // Use fal queue mode to avoid Vercel 10s function timeout
    const { request_id } = await fal.queue.submit('fal-ai/flux/dev/image-to-image', {
      input: {
        image_url: imageUrl,
        prompt: stylePrompt,
        strength: strength || 0.85,
        num_inference_steps: 28,
        guidance_scale: 3.5,
      },
    });

    // Poll for result with timeout
    const result = await fal.queue.result('fal-ai/flux/dev/image-to-image', {
      requestId: request_id,
    });

    const styledImageUrl = result.data?.images?.[0]?.url;
    if (!styledImageUrl) {
      return NextResponse.json({ error: 'Style transfer failed - no image returned' }, { status: 500 });
    }

    // Upload to Supabase Storage for persistence
    let permanentUrl = styledImageUrl;
    let storagePath: string | null = null;

    try {
      const imageResponse = await fetch(styledImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const timestamp = Date.now();
      const filePath = `${userId}/styled-${styleId}-${timestamp}.png`;
      const { error: uploadError } = await supabase.storage.from('coloring-pages').upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(filePath);
        permanentUrl = urlData.publicUrl;
        storagePath = filePath;
      }
    } catch (storageErr) {
      console.error('[StyleTransfer] Storage upload failed:', storageErr);
    }

    // Deduct 3 credits (flux/dev img2img cost)
    if (usageData) {
      await supabase.from('user_usage').update({
        pages_used: pagesUsed + 3,
        plan,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({
        user_id: userId,
        month: currentMonth,
        pages_used: 3,
        plan,
        bonus_credits: 0,
      });
    }

    // Log in generation history
    await supabase.from('generation_history').insert({
      user_id: userId,
      prompt: `[Style: ${styleId}] ${stylePrompt.slice(0, 100)}`,
      style: styleId,
      image_url: permanentUrl,
      storage_path: storagePath,
      credit_cost: 3,
      has_reference: true,
    });

    return NextResponse.json({
      imageUrl: permanentUrl,
      styleId,
      pagesUsed: pagesUsed + 3,
      limit,
      plan,
    });
  } catch (error) {
    console.error('[StyleTransfer] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
