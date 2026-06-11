// Remove Background API - Standalone background removal for product images
// Uses sharp threshold method: white bg → transparent
// Free operation (no additional credits)
export const maxDuration = 30;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

    const body = await req.json();
    const { imageUrl } = body;
    if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });

    // Download the image
    console.log('[RemoveBG] Downloading image');
    const imgResp = await fetch(imageUrl);
    if (!imgResp.ok) return NextResponse.json({ error: 'Failed to download image' }, { status: 500 });
    const imgBuffer = Buffer.from(await imgResp.arrayBuffer());

    // Get dimensions
    const meta = await sharp(imgBuffer).metadata();
    const w = meta.width || 960;
    const h = meta.height || 1280;

    // Extract RGB (3 channels)
    const rgbOnly = await sharp(imgBuffer).removeAlpha().raw().toBuffer();
    // Create alpha mask: white bg → transparent, colored → opaque
    const maskRaw = await sharp(imgBuffer)
      .grayscale()
      .threshold(242)
      .negate()
      .raw()
      .toBuffer();

    // Validate pixel counts
    const expectedPixels = w * h;
    const rgbPixels = rgbOnly.length / 3;
    const maskPixels = maskRaw.length;

    if (rgbPixels !== expectedPixels || maskPixels !== expectedPixels) {
      console.error('[RemoveBG] Pixel mismatch. Expected:', expectedPixels, 'RGB:', rgbPixels, 'Mask:', maskPixels);
      return NextResponse.json({ error: 'Image processing error' }, { status: 500 });
    }

    // Interleave RGB + Alpha
    const rgba = new Uint8Array(expectedPixels * 4);
    const rgbArr = new Uint8Array(rgbOnly);
    const maskArr = new Uint8Array(maskRaw);
    for (let i = 0; i < expectedPixels; i++) {
      rgba[i * 4]     = rgbArr[i * 3];
      rgba[i * 4 + 1] = rgbArr[i * 3 + 1];
      rgba[i * 4 + 2] = rgbArr[i * 3 + 2];
      rgba[i * 4 + 3] = maskArr[i];
    }

    const transparentPng = await sharp(Buffer.from(rgba.buffer as ArrayBuffer) as any, {
      raw: { width: w, height: h, channels: 4 }
    }).png().toBuffer();

    // Upload to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    let permanentUrl = '';
    const ts = Date.now();
    const fp = `${userId}/transparent-${ts}.png`;
    const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, transparentPng, { contentType: 'image/png', upsert: false });
    if (!upErr) {
      const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(fp);
      permanentUrl = urlData.publicUrl;
    }

    console.log('[RemoveBG] Done, transparent PNG created');
    return NextResponse.json({ status: 'completed', imageUrl: permanentUrl || imageUrl });
  } catch (error) {
    console.error('[RemoveBG] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
