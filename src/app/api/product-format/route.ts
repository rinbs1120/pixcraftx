// Product Format API - V1: Transform colored/styled image into product-ready format
// Supported products: fridge-magnet, sticker (canvas-print needs no processing)
// Uses Qwen-Image-Edit-2509 for subject extraction + product formatting
// Cost: ~$0.04/image ≈ ¥0.29, charged 2 credits
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

const PRODUCT_PROMPTS: Record<string, string> = {
  'fridge-magnet': 'Transform this colored illustration into a fridge magnet style illustration. Extract the main subject as a minimalist icon design, slight 3D depth with drop shadow, clean white border outline around the shape, add handwritten English text label below the icon, flat bold colors, white background, cute and clean aesthetic',
  'sticker': 'Transform this colored illustration into a die-cut sticker design. Extract the main subject with a clean white border outline around the shape (3mm bleed), slight 3D depth with subtle drop shadow, bold flat colors, crisp edges suitable for die-cut printing, white background',
};

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
    const { imageUrl, productType } = body;

    if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    if (!productType || !PRODUCT_PROMPTS[productType]) {
      return NextResponse.json({ error: 'Invalid or missing productType. Supported: fridge-magnet, sticker' }, { status: 400 });
    }

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

    const prompt = PRODUCT_PROMPTS[productType];
    // Download and resize image before base64 conversion (reduce payload size)
    console.log('[ProductFormat] Downloading image, product:', productType);
    let imageBase64: string;
    try {
      const imgResp = await fetch(imageUrl);
      if (!imgResp.ok) throw new Error('Failed to fetch image');
      const imgBuffer = Buffer.from(await imgResp.arrayBuffer());
      // Resize: max 1536px on longest side, maintain aspect ratio
      const resized = await sharp(imgBuffer)
        .resize(1536, 1536, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 90 })
        .toBuffer();
      imageBase64 = `data:image/png;base64,${resized.toString('base64')}`;
      console.log('[ProductFormat] Image resized, base64 length:', imageBase64.length);
    } catch (e) {
      console.error('[ProductFormat] Image processing failed:', e);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    const qwenResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit-2509',
        prompt,
        image: imageBase64,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        cfg: 4.0,
      }),
    });

    if (!qwenResp.ok) {
      const err = await qwenResp.text();
      console.error('[ProductFormat] Qwen error:', qwenResp.status, err);
      return NextResponse.json({ error: 'Product formatting failed' }, { status: 500 });
    }

    const qwenData = await qwenResp.json();
    const genUrl = qwenData?.images?.[0]?.url;
    if (!genUrl) return NextResponse.json({ error: 'No image generated' }, { status: 500 });

    // Download result for storage upload
    const resultResp = await fetch(genUrl);
    if (!resultResp.ok) return NextResponse.json({ error: 'Failed to download result' }, { status: 500 });
    const resultBuffer = Buffer.from(await resultResp.arrayBuffer());

    // Remove white background for fridge magnet and sticker products
    let processedBuffer: Buffer = resultBuffer;
    try {
      console.log('[ProductFormat] Removing white background for', productType);
      // Get image metadata for dimensions
      const meta = await sharp(resultBuffer).metadata();
      const w = meta.width || 960;
      const h = meta.height || 1280;

      // Extract original RGB (3 channels, no alpha)
      const rgbOnly = await sharp(resultBuffer).removeAlpha().raw().toBuffer();
      // Create alpha mask directly from pipeline (force 1 channel grayscale)
      // White bg (brightness > 242) → transparent (0), colored → opaque (255)
      const maskRaw = await sharp(resultBuffer)
        .grayscale()
        .threshold(242)    // pixels > 242 → white (255)
        .negate()           // invert: white bg → black (0=transparent), colored → white (255=opaque)
        .raw()
        .toBuffer();

      // Verify pixel counts match
      const expectedPixels = w * h;
      const rgbPixels = rgbOnly.length / 3;
      const maskPixels = maskRaw.length;
      console.log('[ProductFormat] Dimensions:', w, 'x', h, 'RGB pixels:', rgbPixels, 'Mask pixels:', maskPixels);

      if (rgbPixels !== expectedPixels || maskPixels !== expectedPixels) {
        console.warn('[ProductFormat] Pixel count mismatch, skipping background removal. Expected:', expectedPixels, 'RGB:', rgbPixels, 'Mask:', maskPixels);
      } else {
        // Interleave RGB + Alpha into RGBA buffer
        const rgba = new Uint8Array(expectedPixels * 4);
        const rgbArr = new Uint8Array(rgbOnly);
        const maskArr = new Uint8Array(maskRaw);
        for (let i = 0; i < expectedPixels; i++) {
          rgba[i * 4]     = rgbArr[i * 3];     // R
          rgba[i * 4 + 1] = rgbArr[i * 3 + 1]; // G
          rgba[i * 4 + 2] = rgbArr[i * 3 + 2]; // B
          rgba[i * 4 + 3] = maskArr[i];          // A (from mask)
        }

        processedBuffer = await sharp(Buffer.from(rgba.buffer as ArrayBuffer) as any, { raw: { width: w, height: h, channels: 4 } })
          .png()
          .toBuffer();
        console.log('[ProductFormat] Background removed, transparent PNG created');
      }
    } catch (e) {
      console.warn('[ProductFormat] Background removal failed, keeping original:', e);
    }

    // Upload to Supabase Storage
    let permanentUrl = genUrl;
    let storagePath: string | null = null;
    try {
      const ts = Date.now();
      const fp = `${userId}/product-${productType}-${ts}.png`;
      const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, processedBuffer, { contentType: 'image/png', upsert: false });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(fp);
        permanentUrl = urlData.publicUrl;
        storagePath = fp;
      }
    } catch (e) { console.error('[ProductFormat] Storage upload failed:', e); }

    // Deduct credits
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + 2, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: 2, plan, bonus_credits: 0 });
    }

    await supabase.from('generation_history').insert({
      user_id: userId, prompt: `[ProductFormat] ${productType}`, style: 'product-format',
      image_url: permanentUrl, storage_path: storagePath, credit_cost: 2, has_reference: true,
    });

    return NextResponse.json({ status: 'completed', imageUrl: permanentUrl, productType, pagesUsed: pagesUsed + 2, limit, plan });
  } catch (error) {
    console.error('[ProductFormat] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
