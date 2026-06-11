// Auto Color API - V5: Kolors img2img + line art overlay (multiply blend)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

const COLOR_PALETTES: Record<string, { prompt: string; negative: string }> = {
  pastel: {
    prompt: 'CRITICAL: Keep the EXACT same subject and composition as the original image. DO NOT change, replace, or add any subject. DO NOT add flowers, plants, birds, animals, or any decorative elements that were not in the original. Color this illustration with soft pastel tones: light pink, pale green, soft lavender, butter yellow, and sky blue. Gentle light colors with smooth soft gradients, clean flat color fills within the outlines, coloring book style',
    negative: 'dark colors, neon, harsh contrast, muddy, oversaturated, grayscale, black and white, blurry, distorted, low quality, different subject, changed subject, new subject, extra subject, replaced subject, flowers added, birds added, decorative elements added, pattern overlay',
  },
  vivid: {
    prompt: 'CRITICAL: Keep the EXACT same subject and composition as the original image. DO NOT change, replace, or add any subject. DO NOT add flowers, plants, birds, animals, or any decorative elements that were not in the original. Color this illustration with bold vivid saturated colors: bright red, emerald green, royal blue, and gold yellow accents. Rich intense color fills, clean flat colors within the outlines, coloring book style',
    negative: 'muted, pastel, dull, grayscale, black and white, blurry, distorted, low quality, washed out, different subject, changed subject, new subject, extra subject, replaced subject, flowers added, birds added, decorative elements added, pattern overlay',
  },
  muted: {
    prompt: 'CRITICAL: Keep the EXACT same subject and composition as the original image. DO NOT change, replace, or add any subject. DO NOT add flowers, plants, birds, animals, or any decorative elements that were not in the original. Color this illustration with muted earthy tones: sage green, warm terracotta, soft indigo, cream white, and dusty bronze. Desaturated warm vintage colors, subtle and understated palette, clean flat color fills within the outlines, coloring book style',
    negative: 'neon, bright, vivid, oversaturated, harsh, garish, grayscale, black and white, blurry, distorted, low quality, different subject, changed subject, new subject, extra subject, replaced subject, flowers added, birds added, decorative elements added, pattern overlay',
  },
};

async function overlayLineArt(coloredBuffer: Buffer, lineArtBuffer: Buffer): Promise<Buffer> {
  const coloredMeta = await sharp(coloredBuffer).metadata();
  const width = coloredMeta.width || 960;
  const height = coloredMeta.height || 1280;

  const resizedLineArt = await sharp(lineArtBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();

  const resizedColored = await sharp(coloredBuffer)
    .resize(width, height, { fit: 'fill' })
    .ensureAlpha()
    .toBuffer();

  // Multiply blend: black lines stay black, white areas let colors show through
  return sharp(resizedColored)
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
    if (!userId) return NextResponse.json({ error: 'Please sign in to use auto color' }, { status: 401 });

    const body = await req.json();
    const { imageUrl, palette } = body;

    if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    if (!palette || !COLOR_PALETTES[palette]) return NextResponse.json({ error: 'Invalid or missing palette' }, { status: 400 });

    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = (PLAN_LIMITS[plan] || 2) + bonusCredits;

    if (pagesUsed + 2 > limit) return NextResponse.json({ error: 'Not enough credits', limit, used: pagesUsed, needed: 2 }, { status: 429 });

    const paletteConfig = COLOR_PALETTES[palette];

    // Step 1: Download original line art
    console.log('[AutoColor] Downloading original line art...');
    const lineArtResp = await fetch(imageUrl);
    if (!lineArtResp.ok) return NextResponse.json({ error: 'Failed to download original image' }, { status: 500 });
    const lineArtBuffer = Buffer.from(await lineArtResp.arrayBuffer());

    // Step 2: Convert image URL to base64 (Kolors img2img requires base64, not URL)
    console.log('[AutoColor] Converting image to base64...');
    let imageBase64: string;
    try {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) throw new Error('Failed to fetch image for base64 conversion');
      const imgBuffer = Buffer.from(await imgResp.arrayBuffer());
      const contentType = imgResp.headers.get('content-type') || 'image/png';
      imageBase64 = `data:${contentType};base64,${imgBuffer.toString('base64')}`;
    } catch (e) {
      console.error('[AutoColor] Base64 conversion failed:', e);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    // Step 3: Call Kolors img2img with base64
    console.log('[AutoColor] Calling Kolors img2img, palette:', palette);
    const kolorsResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: paletteConfig.prompt,
        negative_prompt: paletteConfig.negative,
        image: imageBase64,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        guidance_scale: 10,
      }),
    });

    if (!kolorsResp.ok) {
      const err = await kolorsResp.text();
      console.error('[AutoColor] Kolors error:', kolorsResp.status, err);
      return NextResponse.json({ error: 'Color generation failed' }, { status: 500 });
    }

    const kolorsData = await kolorsResp.json();
    const genUrl = kolorsData?.images?.[0]?.url;
    if (!genUrl) return NextResponse.json({ error: 'No image generated' }, { status: 500 });

    // Step 4: Download colored result
    const coloredResp = await fetch(genUrl);
    if (!coloredResp.ok) return NextResponse.json({ error: 'Failed to download result' }, { status: 500 });
    const coloredBuffer = Buffer.from(await coloredResp.arrayBuffer());

    // Step 5: Overlay line art (multiply blend)
    let finalBuffer: Buffer;
    try {
      finalBuffer = await overlayLineArt(coloredBuffer, lineArtBuffer);
      console.log('[AutoColor] Line art overlay done');
    } catch (e) {
      console.error('[AutoColor] Overlay failed, using raw:', e);
      finalBuffer = coloredBuffer;
    }

    // Step 6: Upload to Supabase Storage
    let permanentUrl = genUrl;
    let storagePath: string | null = null;
    try {
      const ts = Date.now();
      const fp = `${userId}/autocolor-${ts}.png`;
      const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, finalBuffer, { contentType: 'image/png', upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(fp);
        permanentUrl = urlData.publicUrl;
        storagePath = fp;
      }
    } catch (e) { console.error('[AutoColor] Storage upload failed:', e); }

    // Deduct credits
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + 2, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: 2, plan, bonus_credits: 0 });
    }

    await supabase.from('generation_history').insert({
      user_id: userId, prompt: `[AutoColor] ${palette} palette`, style: 'autocolor',
      image_url: permanentUrl, storage_path: storagePath, credit_cost: 2, has_reference: true,
    });

    return NextResponse.json({ status: 'completed', imageUrl: permanentUrl, pagesUsed: pagesUsed + 2, limit, plan });
  } catch (error) {
    console.error('[AutoColor] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
