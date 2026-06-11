// Extend API route timeout for image generation
export const maxDuration = 60; // 60 seconds max (only effective on Vercel Pro)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import sharp from 'sharp';

// Style-specific prompt modifiers
// Style-specific prompt modifiers
const STYLE_PROMPTS = {
  simple: {
    prefix: "simple coloring page for young children, thin black outlines ONLY on pure white paper, NO solid black filled areas anywhere, large simple shapes with big white open spaces to color in, single isolated subject centered on page, completely blank white background with zero background elements, cartoon style, beginner level, very sparse and clean layout with lots of white space, outlines only no shading,",
    suffix: ", OUTLINE ONLY no solid black fills, strictly monochrome thin outlines, no colors no shading no grayscale no filled areas no shadows no gradients, 90 percent of the image must be white space, only thin contour lines in black, every contour is a fully sealed closed loop, all regions fully enclosed for flood-fill coloring"
  },
  mandala: {
    prefix: "circular mandala coloring page, fully radially symmetric pattern with 8-fold rotational symmetry, thin black outlines ONLY on pure white paper, NO solid black filled areas, repeating geometric motifs radiating from center drawn with outlines only, concentric rings of ornamental line patterns inside a circular frame, lots of white space between the outline patterns,",
    suffix: ", OUTLINE ONLY no solid black fills, strictly monochrome thin outlines, no colors no shading no grayscale no filled areas no gradients, white background outside the circle, all patterns drawn with outline lines not solid fills, every contour is a fully sealed closed loop, all regions fully enclosed for flood-fill coloring"
  },
  intricate: {
    prefix: "detailed adult coloring page, thin black outlines ONLY on pure white paper, NO solid black filled areas anywhere, fine detailed outlines with intricate ornamental patterns, zentangle inspired line decorations, filigree line work, every surface decorated with fine outline patterns but still mostly white space for coloring, elaborate border outlines,",
    suffix: ", OUTLINE ONLY no solid black fills, strictly monochrome thin outlines, no colors no shading no grayscale no filled areas no shadows no gradients, must have plenty of white space between detailed patterns for coloring, all decorative elements drawn as outline lines not solid black fills, every contour is a fully sealed closed loop, all regions fully enclosed for flood-fill coloring"
  }
};

// Negative prompt to suppress color leakage in Kolors model
const NEGATIVE_PROMPT = "color, colored, colorful, paint, painted, watercolor, filled, fill, filling, shading, shadow, gradient, grayscale, grey, gray, tint, hue, saturation, pigment, watercolor wash, ink wash, tone, tonal, realistic, photograph, 3D render, illustration with color, dyed, stain, tinted, chromatic, polychrome, multicolor, any color, slightest color, color tint, color wash, pastel colors, bright colors, dark colors, warm colors, cool colors, green, blue, red, pink, yellow, orange, purple, brown, gold, solid black, black fill, black background, dark background, ink fill, solid fill, silhouette, negative space, reverse outline, woodcut, block print";

// Credit costs - Kolors is cheaper than FLUX
const GENERATE_CREDIT_COST = 1;  // Unified: 50 steps, 1 credit (Kolors is free on SiliconFlow)



// Post-process: ensure pure B&W line art (remove any color leakage from Kolors)
async function toPureBWLineArt(imageBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(imageBuffer)
    .grayscale()
    .normalize()
    .threshold(200)   // Higher threshold: more gray → white, only darkest pixels stay black
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const totalPixels = width * height;

  // Remove large black filled areas - keep only thin lines
  // Strategy: scan for connected black regions, if area > 3% of image, fill it white
  // Lines are thin (1-5px wide), filled areas are large blobs
  const MIN_FILL_RATIO = 0.03; // 3% of image area
  const MIN_FILL_AREA = Math.floor(totalPixels * MIN_FILL_RATIO);

  // Simple approach: for each black pixel, check if it's part of a large connected region
  // Use a flood-fill approach with area tracking
  const visited = new Uint8Array(totalPixels);
  const BLACK = 0;
  const WHITE = 255;

  function idx(x: number, y: number) { return y * width + x; }

  // Flood fill to find connected black region and measure its area
  function floodFillArea(startX: number, startY: number): number[] {
    const region: number[] = [];
    const stack = [idx(startX, startY)];
    while (stack.length > 0 && region.length < MIN_FILL_AREA + 1000) {
      const i = stack.pop()!;
      if (visited[i]) continue;
      const x = i % width;
      const y = Math.floor(i / width);
      if (data[i] !== BLACK) continue;
      visited[i] = 1;
      region.push(i);
      // 4-connectivity
      if (x > 0 && !visited[idx(x-1, y)]) stack.push(idx(x-1, y));
      if (x < width-1 && !visited[idx(x+1, y)]) stack.push(idx(x+1, y));
      if (y > 0 && !visited[idx(x, y-1)]) stack.push(idx(x, y-1));
      if (y < height-1 && !visited[idx(x, y+1)]) stack.push(idx(x, y+1));
    }
    return region;
  }

  // Scan and remove large filled areas
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (data[i] === BLACK && !visited[i]) {
        const region = floodFillArea(x, y);
        if (region.length >= MIN_FILL_AREA) {
          // This is a large filled area, not a line - make it white
          for (const ri of region) {
            data[ri] = WHITE;
          }
        }
      }
    }
  }

  return sharp(Buffer.from(data), { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

const REFERENCE_COST = 5;  // AILabTools ~$0.02

const PLAN_LIMITS = {
  free: 2,
  starter: 60,
  pro: 300,
  business: 1000,
};



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
    // Quality selector removed - always use 50 steps (1 credit)
    let referenceImageUrl: string | null = null;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      prompt = (formData.get('prompt') as string || '').trim();
      style = (formData.get('style') as string || 'simple');
      // quality parameter no longer used
      referenceImageUrl = formData.get('referenceImageUrl') as string || null;
    } else {
      const body = await req.json();
      prompt = (body.prompt || '').trim();
      style = body.style || 'simple';
      referenceImageUrl = body.referenceImageUrl || null;
      // quality parameter removed - unified 50 steps
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

    const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.simple;
    let fullPrompt: string;
    if (referenceImageUrl) {
      fullPrompt = prompt; // AILabTools handles line art natively, just pass user prompt
    } else {
      fullPrompt = `${styleConfig.prefix} ${prompt} ${styleConfig.suffix}`;
    }

    console.log(`[Generate] Style: ${style}, Has reference: ${!!referenceImageUrl}, Prompt: "${prompt.slice(0, 80)}..."`);

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
        // Mark free trial as used, no credit deduction
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

    // ===== Text-to-image: SiliconFlow Kolors (Chinese model for better Oriental understanding) =====
    const siliconflowApiKey = process.env.SILICONFLOW_API_KEY;
    if (!siliconflowApiKey) {
      console.error('[Generate] SILICONFLOW_API_KEY not configured');
      return NextResponse.json({ error: 'Image generation service not configured' }, { status: 500 });
    }

    const inferenceSteps = 50;  // Unified: always 50 steps for best quality
    const kolorsImageSize = '960x1280'; // 3:4 vertical, closest to our 1200x1600 requirement

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
        guidance_scale: 12,
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

    // Try to download and upload to Supabase Storage
    let permanentUrl = tempImageUrl;
    let storagePath: string | null = null;
    let storageFailed = false;

    try {
      const imageResponse = await fetch(tempImageUrl);
      let imageBuffer: ArrayBuffer | Buffer = await imageResponse.arrayBuffer();
      // Post-process: ensure pure B&W line art (Kolors often leaks color)
      try {
        const bwBuffer = await toPureBWLineArt(Buffer.from(imageBuffer));
        imageBuffer = bwBuffer;
        console.log('[Generate] B&W post-processing applied');
      } catch (ppErr) {
        console.error('[Generate] B&W post-processing failed, using raw:', ppErr);
      }
      const timestamp = Date.now();
      const responseContentType = 'image/png'; // sharp outputs PNG after B&W processing
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
