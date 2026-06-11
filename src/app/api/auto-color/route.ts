// Auto Color API - V6: Unified Qwen-Image-Edit-2509 for ALL styles (basic + art)
// One-step from line art → styled result. No more Kolors intermediate step.
// Cost: ~¥0.29/image, charged 3 credits
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

const SILICONFLOW_API = 'https://api.siliconflow.cn/v1/images/generations';

const STYLE_PROMPTS: Record<string, { prompt: string; type: string }> = {
  // Basic palettes
  pastel: {
    prompt: 'Color this black and white line art coloring page with soft pastel colors. Use delicate shades of soft pink pale green lavender butter yellow and sky blue, gentle pearlescent light tones, smooth soft gradients, coloring book style, colors filled neatly within the outlines',
    type: 'basic',
  },
  vivid: {
    prompt: 'Color this black and white line art coloring page with bold vivid colors. Use saturated bright red emerald green sapphire blue and gold yellow accents, clean flat color fills, coloring book style, colors filled neatly within the outlines',
    type: 'basic',
  },
  muted: {
    prompt: 'Color this black and white line art coloring page with muted earthy tones. Use desaturated warm colors of sage green terracotta soft indigo cream white and dusty bronze, subtle and sophisticated palette, coloring book style, colors filled neatly within the outlines',
    type: 'basic',
  },
  // Art styles
  'chubby-doodle': {
    prompt: 'Transform this black and white line art coloring page into a chubby doodle style colored illustration. Use crayon and marker scribble strokes, intentionally messy and wobbly lines, distorted proportions and perspective, colors slightly overflowing the outlines, playful meme-like expressions, hand-drawn spontaneous feel on white paper background',
    type: 'art',
  },
  'pop-art': {
    prompt: 'Transform this black and white line art coloring page into a Pop Art style colored illustration. Use halftone dots, bold outlines, 1950s print art aesthetic, primary colors of red yellow blue with black, Ben-Day dots pattern, comic book color fills, colors filled within the outlines',
    type: 'art',
  },
  'city-pop': {
    prompt: 'Transform this black and white line art coloring page into a City Pop style colored illustration. Use 1980s Japanese anime aesthetic, flat vector art style, high saturation retro color palette, Showa-era nostalgic atmosphere, pastel sky gradient, dreamy vaporwave mood',
    type: 'art',
  },
  'fridge-magnet': {
    prompt: 'Transform this black and white line art coloring page into a fridge magnet style colored illustration. Create a cute chibi icon design with bold outlines, rounded simplified shapes, thick white border around the subject, soft lighting, pastel gradient background, cute kawaii aesthetic',
    type: 'art',
  },
};

const CREDITS_PER_USE = 3;

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
    const { imageUrl, palette, styleId } = body;

    // Support both palette (basic) and styleId (art) params
    const styleKey = styleId || palette;
    if (!imageUrl) return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 });
    if (!styleKey || !STYLE_PROMPTS[styleKey]) return NextResponse.json({ error: 'Invalid or missing style' }, { status: 400 });

    const styleConfig = STYLE_PROMPTS[styleKey];

    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const PLAN_LIMITS: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = (PLAN_LIMITS[plan] || 2) + bonusCredits;

    if (pagesUsed + CREDITS_PER_USE > limit) return NextResponse.json({ error: 'Not enough credits', limit, used: pagesUsed, needed: CREDITS_PER_USE }, { status: 429 });

    // Download and resize image before base64 conversion (reduce payload size)
    console.log('[AutoColor] Downloading image, style:', styleKey);
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
      console.log('[AutoColor] Image resized, base64 length:', imageBase64.length);
    } catch (e) {
      console.error('[AutoColor] Image processing failed:', e);
      return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
    }

    // Call Qwen-Image-Edit-2509 (one-step from line art to styled result)
    console.log('[AutoColor] Calling Qwen, style:', styleKey, 'type:', styleConfig.type);
    const qwenResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit-2509',
        prompt: styleConfig.prompt,
        image: imageBase64,
        image_size: '960x1280',
        batch_size: 1,
        num_inference_steps: 30,
        cfg: 4.0,
      }),
    });

    if (!qwenResp.ok) {
      const err = await qwenResp.text();
      console.error('[AutoColor] Qwen error:', qwenResp.status, err);
      return NextResponse.json({ error: 'Style generation failed' }, { status: 500 });
    }

    const qwenData = await qwenResp.json();
    const genUrl = qwenData?.images?.[0]?.url;
    if (!genUrl) return NextResponse.json({ error: 'No image generated' }, { status: 500 });

    // Download result for storage upload
    const resultResp = await fetch(genUrl);
    if (!resultResp.ok) return NextResponse.json({ error: 'Failed to download result' }, { status: 500 });
    const resultBuffer = Buffer.from(await resultResp.arrayBuffer());

    // Upload to Supabase Storage
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
    } catch (e) { console.error('[AutoColor] Storage upload failed:', e); }

    // Deduct credits
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + CREDITS_PER_USE, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: CREDITS_PER_USE, plan, bonus_credits: 0 });
    }

    await supabase.from('generation_history').insert({
      user_id: userId, prompt: `[AutoColor] ${styleKey}`, style: 'autocolor',
      image_url: permanentUrl, storage_path: storagePath, credit_cost: CREDITS_PER_USE, has_reference: true,
    });

    return NextResponse.json({ status: 'completed', imageUrl: permanentUrl, pagesUsed: pagesUsed + CREDITS_PER_USE, limit, plan });
  } catch (error) {
    console.error('[AutoColor] Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
