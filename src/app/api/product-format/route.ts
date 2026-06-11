// Product Format API - V1: Transform colored/styled image into product-ready format
// Supported products: fridge-magnet, sticker (canvas-print needs no processing)
// Uses Qwen-Image-Edit-2509 for subject extraction + product formatting
// Cost: ~$0.04/image ≈ ¥0.29, charged 2 credits
export const maxDuration = 60;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

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
    console.log('[ProductFormat] Calling Qwen-Image-Edit-2509, product:', productType);

    const qwenResp = await fetch(SILICONFLOW_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Qwen/Qwen-Image-Edit-2509',
        prompt,
        image: imageUrl,
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

    // Upload to Supabase Storage
    let permanentUrl = genUrl;
    let storagePath: string | null = null;
    try {
      const ts = Date.now();
      const fp = `${userId}/product-${productType}-${ts}.png`;
      const { error: upErr } = await supabase.storage.from('coloring-pages').upload(fp, resultBuffer, { contentType: 'image/png', upsert: false });
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
