// Auto Color API - Automatically fill colors into a coloring page using SDXL ControlNet Union
// V3: Async submit+poll pattern - submit returns requestId, client polls for result
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// 3 color palettes with descriptive prompts
const COLOR_PALETTES: Record<string, { prompt: string; negative: string }> = {
  pastel: {
    prompt: 'A beautifully colored Oriental fantasy illustration with soft pastel colors inspired by Chinese ink wash painting, macaron shades of cherry blossom pink jade green lavender imperial yellow and celadon blue, gentle pearlescent light tones, smooth gradients like flowing silk, dreamy Eastern atmosphere with golden particle dust, coloring book style, colors filled neatly within the outlines',
    negative: 'dark colors, neon, harsh contrast, muddy, oversaturated, grayscale, black and white, blurry, distorted, low quality',
  },
  vivid: {
    prompt: 'A vibrantly colored Oriental fantasy illustration with bold vivid colors inspired by Chinese silk embroidery and Dunhuang murals, saturated imperial red jade green sapphire blue and gold accents, rich traditional Caihui decorative palette, clean flat color fills with golden outline highlights, coloring book style, colors filled neatly within the outlines, Eastern palace aesthetic',
    negative: 'muted, pastel, dull, grayscale, black and white, blurry, distorted, low quality, washed out',
  },
  muted: {
    prompt: 'A beautifully colored Oriental fantasy illustration with muted earthy tones inspired by Tang Dynasty sancai pottery and Song Dynasty celadon, desaturated warm colors of sage green terracotta indigo rice-paper white and aged bronze, soft wabi-sabi vintage aesthetic, subtle and sophisticated Eastern palette, coloring book style, colors filled neatly within the outlines',
    negative: 'neon, bright, vivid, oversaturated, harsh, garish, grayscale, black and white, blurry, distorted, low quality',
  },
};

// POST - Submit auto color job
export async function POST(req: NextRequest) {
  try {
    fal.config({ credentials: process.env.FAL_KEY! });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to use auto color' }, { status: 401 });
    }

    const body = await req.json();
    const { imageUrl, palette } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl - a coloring page is required' }, { status: 400 });
    }

    if (!palette || !COLOR_PALETTES[palette]) {
      return NextResponse.json({ error: 'Invalid or missing palette (pastel, vivid, muted)' }, { status: 400 });
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

    if (pagesUsed + 2 > limit) {
      return NextResponse.json({ error: 'Not enough credits for auto color', limit, used: pagesUsed, needed: 2 }, { status: 429 });
    }

    const paletteConfig = COLOR_PALETTES[palette];

    // Submit to fal queue (non-blocking)
    const { request_id } = await fal.queue.submit('fal-ai/sdxl-controlnet-union/image-to-image', {
      input: {
        image_url: imageUrl,
        prompt: paletteConfig.prompt,
        negative_prompt: paletteConfig.negative,
        canny_image_url: imageUrl,
        canny_preprocess: true,
        teed_image_url: imageUrl,
        teed_preprocess: true,
        controlnet_conditioning_scale: 0.8,
        strength: 0.65,
        guidance_scale: 6,
        num_inference_steps: 18,
        num_images: 1,
        format: 'png',
        enable_safety_checker: true,
      },
    });

    console.log('[AutoColor] Submitted job:', request_id);

    // Deduct credits immediately on submit
    if (usageData) {
      await supabase.from('user_usage').update({
        pages_used: pagesUsed + 2,
        plan,
        updated_at: new Date().toISOString(),
      }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({
        user_id: userId,
        month: currentMonth,
        pages_used: 2,
        plan,
        bonus_credits: 0,
      });
    }

    return NextResponse.json({
      status: 'processing',
      requestId: request_id,
      palette,
      pagesUsed: pagesUsed + 2,
      limit,
      plan,
    });
  } catch (error) {
    console.error('[AutoColor] Submit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET - Poll auto color job status
export async function GET(req: NextRequest) {
  try {
    fal.config({ credentials: process.env.FAL_KEY! });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { userId } = await auth();
    if (!userId) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const requestId = req.nextUrl.searchParams.get('requestId');
    if (!requestId) { return NextResponse.json({ error: 'Missing requestId' }, { status: 400 }); }

    const status = await fal.queue.status('fal-ai/sdxl-controlnet-union/image-to-image', { requestId });

    if (status.status === 'COMPLETED') {
      const result = await fal.queue.result('fal-ai/sdxl-controlnet-union/image-to-image', { requestId });
      const coloredImageUrl = result.data?.images?.[0]?.url;

      if (!coloredImageUrl) {
        return NextResponse.json({ status: 'failed', error: 'No image returned' });
      }

      // Upload to Supabase Storage
      let permanentUrl = coloredImageUrl;
      let storagePath: string | null = null;

      try {
        const imageResponse = await fetch(coloredImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const timestamp = Date.now();
        const filePath = `${userId}/autocolor-${timestamp}.png`;
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
        console.error('[AutoColor] Storage upload failed:', storageErr);
      }

      // Log in generation history
      await supabase.from('generation_history').insert({
        user_id: userId,
        prompt: `[AutoColor] palette request`,
        style: 'autocolor',
        image_url: permanentUrl,
        storage_path: storagePath,
        credit_cost: 2,
        has_reference: true,
      });

      return NextResponse.json({ status: 'completed', imageUrl: permanentUrl });
    }

    if (status.status === 'FAILED') {
      return NextResponse.json({ status: 'failed', error: 'Auto color processing failed' });
    }

    // Still in progress
    return NextResponse.json({ status: 'processing' });
  } catch (error) {
    console.error('[AutoColor] Poll error:', error);
    return NextResponse.json({ status: 'failed', error: 'Status check failed' });
  }
}
