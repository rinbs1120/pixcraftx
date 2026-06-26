// Extend API route timeout for image generation
export const maxDuration = 60; // 60 seconds max (only effective on Vercel Pro)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';
import { fal } from '@fal-ai/client';

// ============================================================
// STYLE PROMPTS - Define HOW to render (visual approach only)
// Key principle: SEPARATE style from composition
// - Style controls: line weight, detail level, rendering approach
// - Composition is determined dynamically based on user prompt content
// - FLUX Schnell follows "coloring page" prompts natively — no negative prompt needed
// ============================================================
const STYLE_PROMPTS = {
  simple: {
    // Visual approach: bold, kid-friendly, simple
    prefix: "children's coloring book page, cute cartoon style, bold thick black outlines, simple rounded shapes, large empty areas for crayon coloring,",
    // FLUX follows positive framing well — specify what we WANT, not what to avoid
    suffix: ", black and white outline drawing only, pure white background, all shapes have empty white interiors ready for coloring, no shading no gradients no colors"
  },
  mandala: {
    // Visual approach: symmetrical radial pattern inspired by the subject
    prefix: "circular mandala coloring page design inspired by, symmetrical radial pattern with repeating motifs, decorative geometric design, medium weight lines,",
    // Mandala-specific framing
    suffix: ", black and white outline drawing only, pure white background, perfectly symmetrical, circular frame, no shading no colors"
  },
  intricate: {
    // Visual approach: fine detail, ornate patterns inside shapes
    prefix: "detailed adult coloring book page, fine thin pen lines, ornate decorative scrollwork and patterns inside all shapes, professional ink illustration,",
    // Reinforce coloring page format
    suffix: ", black and white outline drawing only, pure white background, rich interior detail patterns inside all shapes, no shading no gradients no colors"
  }
};

// ============================================================
// NEGATIVE PROMPT - Not used with FLUX Schnell (not supported)
// FLUX follows "coloring page / line art" instructions natively.
// Constraints (no color, no shading, no photo) are in STYLE_PROMPTS suffix as positive framing.
// ============================================================

// ============================================================
// SCENERY DETECTION
// Words that indicate the user wants a scene with background, not an isolated subject.
// Covers: nature, architecture, weather, spatial relationships, atmosphere
// If matched -> render as scenic coloring page (let the scene be)
// If not matched -> render as isolated subject on white paper (clean for coloring)
// ============================================================
const SCENERY_PATTERN = /\b(mountain|mountains|forest|garden|gardens|beaches?|ocean|river|pond|clouds?|sky|trees?|flowers?|field|meadow|sunset|sunrise|rain|snow|rainbow|landscape|underwater|volcano|castle|temples?|palace|island|waterfall|village|city|bridge|tower|gate|coral|reef|lake|cave|cliff|valley|swamp|desert|waves?|sea|shore|coast|hill|jungle|grove|park|lanterns?|moonlight|moonlit|enchanted|floating|fairy|sitting on|standing (in|on|by)|flying (over|through|above)|swimming in|running through|perched on|leaping (through|over|from)|surrounded by|amidst|among|beside|beneath|above the|in the (sky|water|air|cloud|sea|ocean|forest|garden|field|rain|snow|mist|fog)|with (clouds|mountains|trees|flowers|stars|waves|buildings|lanterns|cherry|lotus|bamboo|pine|coral))\b/i;

// ============================================================
// PROMPT BUILDER - Dynamic construction based on user input
// Handles: scene vs isolated subject, mandala transformation,
// user-typed "mandala" detection, reference image bypass
// ============================================================
function buildPrompt(userPrompt: string, style: string, hasReference: boolean): string {
  // Reference images: AILabTools handles line art natively
  if (hasReference) return userPrompt;

  const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.simple;

  // ---- MANDALA STYLE: Transform subject into mandala design ----
  if (style === 'mandala') {
    // If user already mentioned "mandala" in their prompt, don't double up
    if (/mandala/i.test(userPrompt)) {
      return `circular mandala coloring page, symmetrical radial pattern with repeating motifs, decorative geometric design, medium weight lines, ${userPrompt}, black and white outline drawing, white background, perfectly symmetrical, circular frame`;
    }
    // Transform the subject into a mandala-inspired design
    return `${styleConfig.prefix} ${userPrompt} ${styleConfig.suffix}`;
  }

  // ---- SIMPLE & INTRICATE: Detect scene vs isolated subject ----
  const isScenePrompt = SCENERY_PATTERN.test(userPrompt);

  if (isScenePrompt) {
    // User described a scene (e.g., "Owl in enchanted forest", "Dragon soaring through clouds")
    // -> Render as a coloring page scene, let the background elements be part of the page
    return `${styleConfig.prefix} ${userPrompt}, scenic coloring page composition ${styleConfig.suffix}`;
  } else {
    // User just described a subject (e.g., "Dragon", "Cat", "Butterfly")
    // -> Render as isolated subject on clean white paper for easy coloring
    return `${styleConfig.prefix} ${userPrompt}, centered subject alone on white paper ${styleConfig.suffix}`;
  }
}

// ============================================================
// POST-PROCESSING v2: High-quality line art enhancement
// Replaces hard threshold binary with contrast-enhanced grayscale
// Preserves line weight variation and fine detail
// Handles: dark background auto-invert, blank/overfilled recovery
// ============================================================
// DEPRECATED: Post-processing removed — raw model output serves full quality
// Keeping function for reference only; not called in production
async function toPureBWLineArt_DEPRECATED(imageBuffer: Buffer, style: string = 'simple'): Promise<Buffer> {
  // Step 1: Grayscale & normalize for analysis
  const normalized = await sharp(imageBuffer)
    .grayscale()
    .normalize()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = normalized;
  const width = info.width;
  const height = info.height;

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

  // Step 3: Build base pipeline — grayscale + normalize + invert if needed
  let basePipeline = sharp(imageBuffer).grayscale().normalize();
  if (isDarkBackground) {
    basePipeline = basePipeline.negate();
  }

  // Step 4: Style-adaptive contrast enhancement (NO threshold)
  // Instead of forcing pure B&W, we enhance contrast to make lines crisp
  // while preserving subtle line weight variations
  let contrastMultiplier: number, brightnessOffset: number;
  switch (style) {
    case 'simple':
      // Simple: strong contrast, lines should be bold and clear
      contrastMultiplier = 2.0;
      brightnessOffset = -60;
      break;
    case 'intricate':
      // Intricate: moderate contrast, preserve fine thin lines
      contrastMultiplier = 1.6;
      brightnessOffset = -40;
      break;
    case 'mandala':
      // Mandala: balanced contrast
      contrastMultiplier = 1.8;
      brightnessOffset = -50;
      break;
    default:
      contrastMultiplier = 1.8;
      brightnessOffset = -50;
  }

  // Apply contrast + brightness → sharpen → normalize (preserves grayscale)
  let resultBuffer = await basePipeline
    .linear(contrastMultiplier, brightnessOffset)
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.3 })
    .normalize()
    .png({ quality: 100, compressionLevel: 6 })
    .toBuffer();

  // Step 5: Analyze result — check if image is blank or overfilled
  const resultStats = await sharp(resultBuffer)
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const resultData = resultStats.data;
  let whitePixels = 0;
  let blackPixels = 0;
  let midPixels = 0;
  for (let i = 0; i < resultData.length; i += 4) {
    if (resultData[i] > 230) whitePixels++;
    else if (resultData[i] < 40) blackPixels++;
    else midPixels++;
  }
  const totalPixels = whitePixels + blackPixels + midPixels;
  const blackRatio = blackPixels / totalPixels;
  const whiteRatio = whitePixels / totalPixels;

  console.log(`[LineArt v2] Style: ${style}, DarkBG: ${isDarkBackground}, Black%: ${(blackRatio * 100).toFixed(1)}%, Mid%: ${(midPixels / totalPixels * 100).toFixed(1)}%, White%: ${(whiteRatio * 100).toFixed(1)}%`);

  // Step 6: Blank image recovery (>97% white)
  if (whiteRatio > 0.97) {
    console.log('[LineArt v2] Blank image detected - trying stronger contrast');
    let retryPipeline = sharp(imageBuffer).grayscale().normalize();
    if (isDarkBackground) retryPipeline = retryPipeline.negate();
    resultBuffer = await retryPipeline
      .linear(3.0, -200)
      .sharpen({ sigma: 1.0, m1: 0.8, m2: 0.4 })
      .normalize()
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    // Re-check
    const retryStats = await sharp(resultBuffer).grayscale().raw().toBuffer({ resolveWithObject: true });
    let retryNonWhite = 0;
    let retryTotal = 0;
    for (let i = 0; i < retryStats.data.length; i += 4) {
      if (retryStats.data[i] < 230) retryNonWhite++;
      retryTotal++;
    }
    if (retryNonWhite / retryTotal < 0.01) {
      // Still blank — last resort: edge extraction as grayscale
      console.log('[LineArt v2] Still blank - using edge extraction');
      let edgePipeline = sharp(imageBuffer).grayscale().normalize();
      if (isDarkBackground) edgePipeline = edgePipeline.negate();
      resultBuffer = await edgePipeline
        .convolve({ width: 3, height: 3, kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] })
        .normalize()
        .png({ quality: 100, compressionLevel: 6 })
        .toBuffer();
    }
  }

  // Step 7: Overfilled image recovery
  const overfillThreshold = style === 'simple' ? 0.30 : style === 'mandala' ? 0.45 : 0.50;
  if (blackRatio > overfillThreshold) {
    console.log(`[LineArt v2] Overfilled ${style} image (${(blackRatio * 100).toFixed(1)}% black) - recovering`);

    // Try lighter contrast first
    let lighterPipeline = sharp(imageBuffer).grayscale().normalize();
    if (isDarkBackground) lighterPipeline = lighterPipeline.negate();
    const lighterBuffer = await lighterPipeline
      .linear(1.3, -20)
      .sharpen({ sigma: 0.6, m1: 0.4, m2: 0.2 })
      .normalize()
      .png({ quality: 100, compressionLevel: 6 })
      .toBuffer();

    const lighterStats = await sharp(lighterBuffer).grayscale().raw().toBuffer({ resolveWithObject: true });
    let lighterBlack = 0;
    let lighterTotal = 0;
    for (let i = 0; i < lighterStats.data.length; i += 4) {
      if (lighterStats.data[i] < 40) lighterBlack++;
      lighterTotal++;
    }
    const lighterBlackRatio = lighterBlack / lighterTotal;

    if (lighterBlackRatio > 0.02 && lighterBlackRatio <= overfillThreshold) {
      console.log(`[LineArt v2] Lighter contrast recovery: ${(lighterBlackRatio * 100).toFixed(1)}% - acceptable`);
      resultBuffer = lighterBuffer;
    } else {
      // Fallback: edge extraction to pull out just the lines
      console.log(`[LineArt v2] Lighter contrast insufficient - using edge extraction`);
      let edgePipeline = sharp(imageBuffer).grayscale().normalize();
      if (isDarkBackground) edgePipeline = edgePipeline.negate();
      resultBuffer = await edgePipeline
        .convolve({ width: 3, height: 3, kernel: [0, -1, 0, -1, 4, -1, 0, -1, 0] })
        .normalize()
        .png({ quality: 100, compressionLevel: 6 })
        .toBuffer();
    }
  }

  // Step 8: Final white point adjustment — push near-white to pure white for clean background
  // This cleans up the background without destroying line detail
  resultBuffer = await sharp(resultBuffer)
    .linear(1.1, -10)
    .png({ quality: 100, compressionLevel: 6 })
    .toBuffer();

  return resultBuffer;
}

// ============================================================
// POST ROUTE: Generate coloring page
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { userId } = await auth();
    if (!userId) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const body = await req.json();
    const { prompt, style: rawStyle = 'simple', referenceImageUrl } = body;
    const style = ['simple', 'mandala', 'intricate'].includes(rawStyle) ? rawStyle : 'simple';

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // --- Credit check ---
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const plan = usageData?.plan || 'free';
    const pagesUsed = usageData?.pages_used || 0;
    const bonusCredits = usageData?.bonus_credits || 0;
    const refTrialUsed = usageData?.ref_trial_used || false;

    const limits: Record<string, number> = { free: 2, starter: 60, pro: 300, business: 1000 };
    const limit = (limits[plan] || 2) + bonusCredits;
    const baseCost = 1;
    const refExtraCost = 5;
    const refTrialApplied = !!referenceImageUrl && !refTrialUsed;
    const creditCost = refTrialApplied ? baseCost : (referenceImageUrl ? baseCost + refExtraCost : baseCost);

    if (pagesUsed + creditCost > limit) {
      return NextResponse.json({ error: 'Monthly limit reached', limit, used: pagesUsed, needed: creditCost, plan }, { status: 429 });
    }

    // ============================================================
    // BUILD PROMPT - Dynamic construction based on user input
    // ============================================================
    const fullPrompt = buildPrompt(prompt.trim(), style, !!referenceImageUrl);

    const isScenePrompt = SCENERY_PATTERN.test(prompt.trim());
    console.log(`[Generate] Style: ${style}, Scene: ${isScenePrompt}, Has reference: ${!!referenceImageUrl}, Full prompt: "${fullPrompt.slice(0, 150)}..."`);

    if (referenceImageUrl) {
      // ===== AILabTools "Photo to Coloring Page" API =====
      console.log('[Generate] Submitting to AILabTools Photo to Coloring Page API');
      const ailabApiKey = process.env.AILABTOOLS_API_KEY;
      if (!ailabApiKey) {
        return NextResponse.json({ error: 'Reference image service not configured' }, { status: 500 });
      }

      const base64Match = referenceImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json({ error: 'Invalid reference image format' }, { status: 400 });
      }
      const imageExt = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1];
      const imageBuffer = Buffer.from(base64Match[2], 'base64');

      const formData = new FormData();
      const imageBlob = new Blob([imageBuffer], { type: `image/${imageExt}` });
      formData.append('image', imageBlob, `reference.${imageExt}`);
      formData.append('prompt', fullPrompt);
      formData.append('image_size', 'auto');

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

    // ===== Text-to-image: fal.ai FLUX Schnell =====
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      console.error('[Generate] FAL_KEY not configured');
      return NextResponse.json({ error: 'Image generation service not configured' }, { status: 500 });
    }
    fal.config({ credentials: falKey });

    console.log(`[Generate] Model: fal-ai/flux/schnell, Steps: 4, Guidance: 3.5, Credit cost: ${creditCost}`);

    // FLUX Schnell: 4 steps, guidance_scale 3.5, portrait_4_3 (960x1280 equivalent)
    // No negative_prompt — FLUX doesn't support it; constraints are in the prompt itself
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'portrait_4_3',
        num_inference_steps: 4,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
        output_format: 'png',
      },
    });

    const tempImageUrl = result.data?.images?.[0]?.url;

    if (!tempImageUrl) {
      console.error('[Generate] No image URL in FLUX response:', JSON.stringify(result).slice(0, 300));
      return NextResponse.json({ error: 'Image generation failed - no image returned' }, { status: 500 });
    }

    // Download and upload to Supabase Storage
    let permanentUrl = tempImageUrl;
    let storagePath: string | null = null;
    let storageFailed = false;

    try {
      const imageResponse = await fetch(tempImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      // No post-processing — serve raw model output at full quality
      console.log('[Generate] Using raw FLUX Schnell output (no post-processing)');
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

    if (taskStatus === 0 || taskStatus === 1) {
      return NextResponse.json({ status: 'processing' });
    }

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
