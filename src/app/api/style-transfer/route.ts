// Style Transfer API - Transform a coloring page into styled artwork
// V4: Using SiliconFlow Kolors img2img (synchronous, free)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Check usage limits
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

    // Call Kolors img2img (synchronous, ~5-10 seconds)
    console.log('[StyleTransfer] Calling Kolors img2img with style:', styleId);

    const kolorsResponse = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: stylePrompt,
        negative_prompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy',
        image: imageUrl,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        guidance_scale: 7.5,
      }),
    });

    if (!kolorsResponse.ok) {
      const errorText = await kolorsResponse.text();
      console.error('[StyleTransfer] Kolors API error:', kolorsResponse.status, errorText);
      return NextResponse.json({ error: 'Style transfer failed. Please try again.' }, { status: 500 });
    }

    const kolorsData = await kolorsResponse.json();
    const generatedImageUrl = kolorsData?.images?.[0]?.url;

    if (!generatedImageUrl) {
      console.error('[StyleTransfer] No image returned from Kolors:', kolorsData);
      return NextResponse.json({ error: 'No image generated. Please try again.' }, { status: 500 });
    }

    // Upload to Supabase Storage (Kolors URL expires in 1 hour)
    let permanentUrl = generatedImageUrl;
    let storagePath: string | null = null;

    try {
      const imageResponse = await fetch(generatedImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const timestamp = Date.now();
      const filePath = `${userId}/styled-${timestamp}.png`;
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

    // Deduct credits
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
      prompt: `[StyleTransfer] ${styleId || 'custom'}`,
      style: 'style-transfer',
      image_url: permanentUrl,
      storage_path: storagePath,
      credit_cost: 3,
      has_reference: true,
    });

    return NextResponse.json({
      status: 'completed',
      imageUrl: permanentUrl,
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
