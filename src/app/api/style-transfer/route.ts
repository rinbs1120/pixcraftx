// Style Transfer API - V5: Kolors img2img + line art overlay (multiply blend)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

async function overlayLineArt(styledBuffer: Buffer, lineArtBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(styledBuffer).metadata();
  const width = meta.width || 960;
  const height = meta.height || 1280;

  const resizedLineArt = await sharp(lineArtBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();

  const resizedStyled = await sharp(styledBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();

  // Multiply blend: black lines stay black, white areas let styled colors show through
  return sharp(resizedStyled)
    .composite([{ input: resizedLineArt, blend: 'multiply' }])
    .png()
    .toBuffer();
}

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

    // Step 1: Download original line art
    console.log('[StyleTransfer] Downloading original line art...');
    const lineArtResp = await fetch(imageUrl);
    if (!lineArtResp.ok) return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
    const lineArtBuffer = Buffer.from(await lineArtResp.arrayBuffer());

    // Step 2: Call Kolors img2img
    console.log('[StyleTransfer] Calling Kolors img2img, style:', styleId);
    const kolorsResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: stylePrompt,
        negative_prompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy, grayscale, black and white, different subject, different composition',
        image: imageUrl,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        guidance_scale: 7.5,
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

    // Step 3: Download styled result
    const styledResp = await fetch(genUrl);
    if (!styledResp.ok) return NextResponse.json({ error: 'Failed to download result' }, { status: 500 });
    const styledBuffer = Buffer.from(await styledResp.arrayBuffer());

    // Step 4: Overlay line art (multiply blend)
    let finalBuffer: Buffer;
    try {
      finalBuffer = await overlayLineArt(styledBuffer, lineArtBuffer);
      console.log('[StyleTransfer] Line art overlay done');
    } catch (e) {
      console.error('[StyleTransfer] Overlay failed, using raw:', e);
      finalBuffer = styledBuffer;
    }

    // Step 5: Upload to Supabase Storage
    let permanentUrl = genUrl;
    let storagePath: string | null = null;
    try {
      const ts = Date.now();
      const fp = `${userId}/styled-${ts}.png`;
      const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, finalBuffer, { contentType: 'image/png', upsert: false });
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
