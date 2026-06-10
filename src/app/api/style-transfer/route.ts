// Style Transfer API - V6: Kolors img2img, NO line art overlay (style defines line quality), high guidance
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const body = await req.json();
    const { imageUrl, stylePrompt, styleId, strength } = body;

    if (!stylePrompt) return NextResponse.json({ error: 'Missing stylePrompt' }, { status: 400 });
    if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });

    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = (PLAN_LIMITS[plan] || 2) + bonusCredits;

    if (pagesUsed + 3 > limit) return NextResponse.json({ error: 'Not enough credits', limit, used: pagesUsed, needed: 3 }, { status: 429 });

    // Add CRITICAL prefix to force dramatic style transformation
    const enhancedPrompt = `CRITICAL: Dramatically transform this illustration's visual style. Do NOT just adjust colors — completely change the art technique, line quality, and visual treatment. ${stylePrompt}`;

    // Call Kolors img2img — NO line art overlay, style must define line quality
    console.log('[StyleTransfer] Calling Kolors img2img, style:', styleId, 'strength:', strength);
    const kolorsResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: enhancedPrompt,
        negative_prompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy, grayscale, black and white, different subject, different composition, just color change, minor adjustment, same style, original style, same lines, same technique, no transformation',
        image: imageUrl,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        guidance_scale: 15,
      }),
    });

    if (!kolorsResp.ok) {
      const err = await kolorsResp.text();
      console.error('[StyleTransfer] Kolors error:', kolorsResp.status, err);
      return NextResponse.json({ error: 'Style transfer failed' }, { status: 500 });
    }

    const kolorsData = await kolorsResp.json();
    const genUrl = kolorsData?.images?.[0]?.url;
    if (!genUrl) return NextResponse.json({ error: 'No image generated' }, { status: 500 });

    // Download result for storage upload
    const resultResp = await fetch(genUrl);
    if (!resultResp.ok) return NextResponse.json({ error: 'Failed to download result' }, { status: 500 });
    const resultBuffer = Buffer.from(await resultResp.arrayBuffer());

    // Upload to Supabase Storage (NO line art overlay — style defines everything)
    let permanentUrl = genUrl;
    let storagePath: string | null = null;
    try {
      const ts = Date.now();
      const fp = `${userId}/styled-${ts}.png`;
      const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, resultBuffer, { contentType: 'image/png', upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(fp);
        permanentUrl = urlData.publicUrl;
        storagePath = fp;
      }
    } catch (e) { console.error('[StyleTransfer] Storage upload failed:', e); }

    // Deduct credits
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + 3, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: 3, plan, bonus_credits: 0 });
    }

    await supabase.from('generation_history').insert({
      user_id: userId, prompt: `[StyleTransfer] ${styleId || 'custom'}`, style: 'style-transfer',
      image_url: permanentUrl, storage_path: storagePath, credit_cost: 3, has_reference: true,
    });

    return NextResponse.json({ status: 'completed', imageUrl: permanentUrl, pagesUsed: pagesUsed + 3, limit, plan });
  } catch (error) {
    console.error('[StyleTransfer] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
