// Style Transfer API - Transform a coloring page into styled artwork
// MVP: Uses text-to-image with combined prompt (original + style)
// TODO: Upgrade to image-to-image for better composition preservation
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
    const { prompt: originalPrompt, stylePrompt, styleId } = body;

    if (!stylePrompt) {
      return NextResponse.json({ error: 'Missing stylePrompt' }, { status: 400 });
    }

    // Check usage limits (style transfer costs 1 credit)
    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = (PLAN_LIMITS[plan] || 2) + bonusCredits;

    if (pagesUsed + 1 > limit) {
      return NextResponse.json({ error: 'Not enough credits for style transfer', limit, used: pagesUsed, needed: 1 }, { status: 429 });
    }

    // Combine original prompt with style prompt
    const fullPrompt = `${stylePrompt}. Subject: ${originalPrompt || 'a cute character'}`;

    // Use flux/schnell for fast generation
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'portrait_4_3',
        num_images: 1,
      },
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

    // Deduct credit
    if (usageData) {
      await supabase.from('user_usage').update({
        pages_used: pagesUsed + 1,
        plan,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({
        user_id: userId,
        month: currentMonth,
        pages_used: 1,
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
      credit_cost: 1,
      has_reference: false,
    });

    return NextResponse.json({
      imageUrl: permanentUrl,
      styleId,
      pagesUsed: pagesUsed + 1,
      limit,
      plan,
    });
  } catch (error) {
    console.error('[StyleTransfer] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
