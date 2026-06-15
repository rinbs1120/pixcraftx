// Extend API route timeout for image generation
export const maxDuration = 60; // 60 seconds max (only effective on Vercel Pro)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

// ============================================================
// STYLE PROMPTS
// Key principle: POSITIVE framing, distinct visual concepts per style
// Kolors responds to WHAT to draw, not what NOT to draw
// ============================================================
const STYLE_PROMPTS = {
  simple: {
    prefix: "coloring book page for young children, cute cartoon animal style, bold black outlines, very simple shapes, large empty white areas inside shapes for crayon coloring, single centered subject, plain white paper background,",
    suffix: ", black and white outline drawing only, white background, no solid filled black areas, every area should be empty and ready to color"
  },
  mandala: {
    prefix: "circular mandala coloring page for adults, symmetrical radial pattern, decorative geometric design with repeating motifs, centered on page, medium weight lines, white paper,",
    suffix: ", black and white outline drawing only, white background, perfectly symmetrical left and right"
  },
  intricate: {
    prefix: "detailed adult coloring book page, ornate decorative patterns inside all shapes, fine thin pen lines, intricate scrollwork and floral motifs within the subject, professional ink illustration, single centered subject, white paper,",
    suffix: ", black and white outline drawing only, white background, rich interior patterns and textures for detailed coloring"
  }
};

// ============================================================
// NEGATIVE PROMPT
// Principle: MINIMAL - only suppress what we absolutely cannot post-process away
// DO NOT include scenery/landscape words - they conflict with user prompts and cause blank images
// DO NOT include "background" - confuses the model
// Post-processing handles: dark backgrounds, color leaks, solid fills
// ============================================================
const NEGATIVE_PROMPT = "color, colored, colorful, watercolor, oil painting, photograph, realistic photo, 3D render, shading, shadow, gradient, grayscale";

// ============================================================
// POST-PROCESSING: Smart B&W conversion
// Handles: dark background auto-invert, blank image detection,
// overfilled image edge extraction, adaptive threshold per style
// ============================================================
async function toPureBWLineArt(imageBuffer: Buffer, style: string = 'simple'): Promise<Buffer> {
  // Step 1: Grayscale & normalize for analysis
  const normalized = await sharp(imageBuffer)
    .grayscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = normalized;
  const width = info.width;
  const height = info.height;
  const pixelCount = width * height;

  // Step 2: Sample edge pixels to detect dark background
  let darkEdgePixels = 0;
  let edgeSampleCount = 0;
  const xStep = Math.max(1, Math.floor(width / 50));
  const yStep = Math.max(1, Math.floor(height / 50));

  for (let x = 0; x < width; x += xStep) {
    if (data[x] < 128) darkEdgePixels++;
    if (data[(height - 1) * width + x] < 128) darkEdgePixels++;
    edgeSampleCount += 2;
  }
  for (let y = 0; y < height; y += yStep) {
    if (data[y * width] < 128) darkEdgePixels++;
    if (data[y * width + width - 1] < 128) darkEdgePixels++;
    edgeSampleCount += 2;
  }
  const isDarkBackground = darkEdgePixels / edgeSampleCount > 0.5;

  // Step 3: Build base pipeline
  let pipeline = sharp(imageBuffer).grayscale().normalize();
  if (isDarkBackground) {
    pipeline = pipeline.negate();
  }

  // Step 4: Adaptive threshold by style
  // Simple: higher (bold lines survive, faint noise removed)
  // Intricate: lower (preserve fine thin lines)
  // Mandala: medium
  const baseThreshold = style === 'intricate' ? 130 : style === 'mandala' ? 150 : 160;

  // Step 5: Apply threshold
  let resultBuffer = await pipeline.threshold(baseThreshold).png().toBuffer();

  // Step 6: Analyze result - check for blank or overfilled images
  const resultStats = await sharp(resultBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const resultData = resultStats.data;
  let whitePixels = 0;
  let blackPixels = 0;
  for (let i = 0; i < resultData.length; i += 4) { // sample every 4th pixel for speed
    if (resultData[i] > 200) whitePixels++;
    else blackPixels++;
  }
  const totalSampled = whitePixels + blackPixels;
  const blackRatio = blackPixels / totalSampled;
  const whiteRatio = whitePixels / totalSampled;

  console.log(`[BW] Style: ${style}, DarkBG: ${isDarkBackground}, Threshold: ${baseThreshold}, Black%: ${(blackRatio * 100).toFixed(1)}%, White%: ${(whiteRatio * 100).toFixed(1)}%`);

  // Step 7: Blank image recovery (>95% white = model produced nothing useful)
  if (whiteRatio > 0.95) {
    console.log('[BW] Blank image detected - trying lower threshold');
    // Retry with much lower threshold to catch faint lines
    let retryPipeline = sharp(imageBuffer).grayscale().normalize();
    if (isDarkBackground) retryPipeline = retryPipeline.negate();
    const retryBuffer = await retryPipeline.threshold(80).png().toBuffer();

    // Check retry result
    const retryStats = await sharp(retryBuffer).grayscale().raw().toBuffer({ resolveWithObject: true });
    let retryBlack = 0;
    let retryTotal = 0;
    for (let i = 0; i < retryStats.data.length; i += 4) {
      if (retryStats.data[i] <= 200) retryBlack++;
      retryTotal++;
    }
    if (retryBlack / retryTotal > 0.02) {
      // Found some content with lower threshold
      console.log(`[BW] Recovery successful with threshold 80, black%: ${(retryBlack / retryTotal * 100).toFixed(1)}%`);
      resultBuffer = retryBuffer;
    } else {
      // Still blank - return the normalized grayscale without threshold (at least user can see something)
      console.log('[BW] Still blank after recovery - returning grayscale without threshold');
      let fallbackPipeline = sharp(imageBuffer).grayscale().normalize();
      if (isDarkBackground) fallbackPipeline = fallbackPipeline.negate();
      // Increase contrast significantly to make faint lines visible
      resultBuffer = await fallbackPipeline.linear(2.5, -180).png().toBuffer();
    }
  }
  // Step 8: Overfilled image recovery (>40% black = too much solid fill)
  // For Simple style: extract edges only using Laplacian
  else if (blackRatio > 0.4 && style === 'simple') {
    console.log(`[BW] Overfilled Simple image (${(blackRatio * 100).toFixed(1)}% black) - extracting edges`);
    // Use Laplacian edge detection to convert solid fills to outlines
    resultBuffer = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .convolve({
        width: 3,
        height: 3,
        kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] // Laplacian edge detection
      })
      .threshold(30)
      .png()
      .toBuffer();

    // Verify the edge extraction produced something
    const edgeStats = await sharp(resultBuffer).grayscale().raw().toBuffer({ resolveWithObject: true });
    let edgeBlack = 0;
    let edgeTotal = 0;
    for (let i = 0; i < edgeStats.data.length; i += 4) {
      if (edgeStats.data[i] <= 200) edgeBlack++;
      edgeTotal++;
    }
    const edgeBlackRatio = edgeBlack / edgeTotal;
    if (edgeBlackRatio < 0.01 || edgeBlackRatio > 0.6) {
      // Edge extraction failed (too little or too much) - fall back to threshold result
      console.log(`[BW] Edge extraction produced ${(edgeBlackRatio * 100).toFixed(1)}% black - reverting to threshold`);
      let fallbackPipeline = sharp(imageBuffer).grayscale().normalize();
      if (isDarkBackground) fallbackPipeline = fallbackPipeline.negate();
      resultBuffer = await fallbackPipeline.threshold(baseThreshold).png().toBuffer();
    }
  }

  return resultBuffer;
}

const REFERENCE_COST = 5;  // AILabTools ~$0.02

const PLAN_LIMITS = {
  free: 2,
  starter: 60,
  pro: 300,
  business: 1000,
};

const GENERATE_CREDIT_COST = 1;

async function moderatePrompt(prompt: string, externalId?: string): Promise<'allow' | 'flag' | 'deny'> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    console.warn('[Moderation] CREEM_API_KEY not set, skipping moderation');
    return 'allow';
  }
  try {
    const baseUrl = apiKey.startsWith('creem_test_') ? 'https://test-api.creem.io' : 'https://api.creem.io';
    const res = await fetch(`${baseUrl}/v1/moderation/prompt`, {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ prompt, ...(externalId ? { external_id: externalId } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) { console.error(`[Moderation] API returned ${res.status}`); return 'deny'; }
    const data = await res.json();
    console.log(`[Moderation] Decision: ${data.decision} for prompt: "${prompt.slice(0, 50)}..."`);
    return data.decision;
  } catch (err) {
    console.error('[Moderation] Error:', err);
    return 'deny';
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to generate coloring pages' }, { status: 401 });
    }

    let prompt = '';
    let style = 'simple';
    let referenceImageUrl: string | null = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      prompt = (formData.get('prompt') as string || '').trim();
      style = (formData.get('style') as string || 'simple');
      referenceImageUrl = formData.get('referenceImageUrl') as string || null;
    } else {
      const body = await req.json();
      prompt = (body.prompt || '').trim();
      style = body.style || 'simple';
      referenceImageUrl = body.referenceImageUrl || null;
    }

    if (!prompt || prompt.length === 0) {
      return NextResponse.json({ error: 'Please enter a description' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
    }

    const moderationDecision = await moderatePrompt(prompt, `user_${userId}`);
    if (moderationDecision === 'flag') {
      console.warn('[Moderation] Flagged but allowing:', prompt.slice(0, 50));
    }
    if (moderationDecision === 'deny') {
      return NextResponse.json({ error: 'Your prompt could not be processed. Please revise and try again.' }, { status: 400 });
    }

    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used, bonus_credits').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const baseLimit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 2;
    const limit = baseLimit + bonusCredits;
    let creditCost = referenceImageUrl ? REFERENCE_COST : GENERATE_CREDIT_COST;

    // Reference image free trial: first reference image is free
    let refTrialUsed = false;
    let refTrialApplied = false;
    if (referenceImageUrl) {
      const { data: trialData } = await supabase.from('user_usage').select('ref_trial_used').eq('user_id', userId).eq('month', currentMonth).single();
      refTrialUsed = trialData?.ref_trial_used || false;
      if (!refTrialUsed) {
        refTrialApplied = true;
        creditCost = 0; // Free trial!
      }
    }

    if (creditCost > 0 && pagesUsed + creditCost > limit) {
      return NextResponse.json({ error: 'Not enough credits', limit, used: pagesUsed, needed: creditCost, plan }, { status: 429 });
    }

    // ============================================================
    // BUILD PROMPT - No scenery stripping, trust the coloring page framing
    // ============================================================
    const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.simple;
    let fullPrompt: string;
    if (referenceImageUrl) {
      fullPrompt = prompt; // AILabTools handles line art natively, just pass user prompt
    } else {
      fullPrompt = `${styleConfig.prefix} ${prompt} ${styleConfig.suffix}`;
    }

    console.log(`[Generate] Style: ${style}, Has reference: ${!!referenceImageUrl}, Full prompt: "${fullPrompt.slice(0, 120)}..."`);

    if (referenceImageUrl) {
      // ===== AILabTools "Photo to Coloring Page" API =====
      console.log('[Generate] Submitting to AILabTools Photo to Coloring Page API');
      const ailabApiKey = process.env.AILABTOOLS_API_KEY;
      if (!ailabApiKey) {
        return NextResponse.json({ error: 'Reference image service not configured' }, { status: 500 });
      }

      // Convert base64 data URL to Buffer
      const base64Match = referenceImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json({ error: 'Invalid reference image format' }, { status: 400 });
      }
      const imageExt = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
      const imageBuffer = Buffer.from(base64Match[2], 'base64');

      // Build multipart form data
      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: `image/${imageExt}` });
      formData.append('image', imageBlob, `reference.${imageExt}`);
      formData.append('prompt', fullPrompt);
      formData.append('image_size', 'auto');

      // Submit - returns task_id immediately (async)
      const submitRes = await fetch('https://www.ailabapi.com/api/image/effects/photo-to-line-art', {
        method: 'POST',
        headers: { 'ailabapi-api-key': ailabApiKey },
        body: formData,
      });

      const submitData = await submitRes.json();
      console.log('[Generate] AILabTools submit response:', JSON.stringify(submitData).slice(0, 300));

      if (submitData.error_code !== 0 || !submitData.task_id) {
        console.error('[Generate] AILabTools submit failed:', submitData);
        return NextResponse.json({ error: submitData.error_msg || 'Failed to submit reference image for processing' }, { status: 500 });
      }

      const taskId = submitData.task_id;

      // Store pending job in generation_history
      const { data: historyEntry } = await supabase
        .from('generation_history')
        .insert({
          user_id: userId, prompt, style,
          image_url: '', storage_path: null,
          credit_cost: creditCost, has_reference: true,
          fal_request_id: taskId,
          status: 'processing',
        })
        .select('id')
        .single();

      // Deduct credits (or mark trial used)
      if (refTrialApplied) {
        if (usageData) {
          await supabase.from('user_usage').update({ ref_trial_used: true, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
        } else {
          await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: 0, plan, ref_trial_used: true, bonus_credits: 0 });
        }
      } else {
        if (usageData) {
          await supabase.from('user_usage').update({ pages_used: pagesUsed + creditCost, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
        } else {
          await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: creditCost, plan, bonus_credits: 0 });
        }
      }

      return NextResponse.json({
        status: 'processing',
        requestId: taskId,
        historyId: historyEntry?.id,
        pagesUsed: refTrialApplied ? pagesUsed : pagesUsed + creditCost,
        limit, plan, creditCost,
        hasReference: true,
        refTrialApplied,
      });
    }

    // ===== Text-to-image: SiliconFlow Kolors =====
    const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
    if (!siliconflowApiKey) {
      console.error('[Generate] SILICONFLOW_API_KEY not configured');
      return NextResponse.json({ error: 'Image generation service not configured' }, { status: 500 });
    }

    const inferenceSteps = 50;
    const kolorsImageSize = '960x1280'; // 3:4 vertical

    console.log(`[Generate] Model: SiliconFlow Kolors, Steps: ${inferenceSteps}, Credit cost: ${creditCost}`);

    const sfResponse = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${siliconflowApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Kwai-Kolors/Kolors',
        prompt: fullPrompt,
        image_size: kolorsImageSize,
        batch_size: 1,
        num_inference_steps: inferenceSteps,
        guidance_scale: 15, // Higher for better instruction following
        negative_prompt: NEGATIVE_PROMPT,
      }),
    });

    if (!sfResponse.ok) {
      const errorText = await sfResponse.text();
      console.error('[Generate] SiliconFlow API error:', sfResponse.status, errorText);
      return NextResponse.json({ error: 'Image generation failed', details: errorText.slice(0, 200) }, { status: 500 });
    }

    const sfData = await sfResponse.json();
    const tempImageUrl = sfData.images?.[0]?.url;

    if (!tempImageUrl) {
      console.error('[Generate] No image URL in SiliconFlow response:', JSON.stringify(sfData).slice(0, 300));
      return NextResponse.json({ error: 'Image generation failed - no image returned' }, { status: 500 });
    }

    // Download and upload to Supabase Storage
    let permanentUrl = tempImageUrl;
    let storagePath: string | null = null;
    let storageFailed = false;

    try {
      const imageResponse = await fetch(tempImageUrl);
      let imageBuffer: ArrayBuffer | Buffer = await imageResponse.arrayBuffer();
      // Post-process: smart B&W conversion with all recovery logic
      try {
        const bwBuffer = await toPureBWLineArt(Buffer.from(imageBuffer), style);
        imageBuffer = bwBuffer;
        console.log('[Generate] B&W post-processing applied');
      } catch (ppErr) {
        console.error('[Generate] B&W post-processing failed, using raw:', ppErr);
      }
      const timestamp = Date.now();
      const responseContentType = 'image/png';
      const fileExt = 'png';
      const filePath = `${userId}/${style}-${timestamp}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('coloring-pages').upload(filePath, imageBuffer, { contentType: responseContentType, upsert: false });
      if (uploadError) { console.error('[Storage] Upload failed:', uploadError); storageFailed = true; }
      else {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(filePath);
        permanentUrl = urlData.publicUrl;
        storagePath = filePath;
      }
    } catch (storageErr) { console.error('[Storage] Upload exception:', storageErr); storageFailed = true; }

    // Deduct credits
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + creditCost, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: creditCost, plan, bonus_credits: 0 });
    }

    // Log generation history
    await supabase.from('generation_history').insert({
      user_id: userId, prompt, style,
      image_url: permanentUrl, storage_path: storagePath,
      credit_cost: creditCost, has_reference: false,
    });

    return NextResponse.json({
      imageUrl: permanentUrl, style,
      pagesUsed: pagesUsed + creditCost, limit, plan, creditCost,
      hasReference: false,
      ...(storageFailed ? { storageWarning: 'Image stored temporarily, may expire' } : {}),
    });

  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET /api/generate - Poll AILabTools async task for reference image result
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { userId } = await auth();
    if (!userId) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const requestId = req.nextUrl.searchParams.get('requestId');
    if (!requestId) { return NextResponse.json({ error: 'Missing requestId' }, { status: 400 }); }

    const ailabApiKey = process.env.AILABTOOLS_API_KEY;
    if (!ailabApiKey) { return NextResponse.json({ error: 'Reference image service not configured' }, { status: 500 }); }

    // Poll AILabTools async task result
    const pollRes = await fetch(
      `https://www.ailabapi.com/api/common/query-async-task-result?task_id=${requestId}`,
      { headers: { 'ailabapi-api-key': ailabApiKey } }
    );
    const pollData = await pollRes.json();
    console.log('[Poll] AILabTools task status:', pollData.task_status, 'for task:', requestId.slice(0, 12));

    if (pollData.error_code && pollData.error_code !== 0) {
      console.error('[Poll] AILabTools error:', pollData);
      return NextResponse.json({ status: 'failed', error: pollData.error_msg || 'Processing failed' });
    }

    const taskStatus = pollData.task_status;

    // 0=queued, 1=processing
    if (taskStatus === 0 || taskStatus === 1) {
      return NextResponse.json({ status: 'processing' });
    }

    // 2=completed
    if (taskStatus === 2) {
      const imageUrl =
        pollData.data?.result_urls?.[0] ||
        pollData.data?.image_url ||
        pollData.data?.url ||
        pollData.output?.image_url ||
        null;

      if (!imageUrl) {
        console.error('[Poll] No image URL in completed result:', JSON.stringify(pollData).slice(0, 500));
        return NextResponse.json({ status: 'failed', error: 'No image in result' });
      }

      // Download and upload to Supabase Storage
      let permanentUrl = imageUrl;
      let storagePath: string | null = null;

      try {
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const timestamp = Date.now();
        const responseContentType = imageResponse.headers.get('content-type') || 'image/png';
        const fileExt = responseContentType.includes('webp') ? 'webp' : 'png';
        const filePath = `${userId}/ref-${timestamp}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('coloring-pages').upload(filePath, imageBuffer, { contentType: responseContentType, upsert: false });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(filePath);
          permanentUrl = urlData.publicUrl;
          storagePath = filePath;
        }
      } catch (storageErr) {
        console.error('[Poll] Storage upload failed:', storageErr);
      }

      // Update generation_history
      await supabase.from('generation_history')
        .update({ image_url: permanentUrl, storage_path: storagePath, status: 'completed' })
        .eq('fal_request_id', requestId)
        .eq('user_id', userId);

      return NextResponse.json({ status: 'completed', imageUrl: permanentUrl });
    }

    return NextResponse.json({ status: 'processing' });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
