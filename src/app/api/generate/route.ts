// Extend API route timeout for image generation
export const maxDuration = 60; // 60 seconds max (only effective on Vercel Pro)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// Style-specific prompt modifiers
const STYLE_PROMPTS = {
  simple: {
    prefix: "vector line art coloring page, bold thick black outlines minimum 3pt weight, pure black ink on white paper, clean closed contours, complete line borders, simple shapes with large areas to color, isolated subject on plain white background,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no shadows, no gradients, white background, cartoon style outline only, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  },
  mandala: {
    prefix: "vector line art coloring page, symmetrical mandala pattern, pure black ink on white paper, consistent medium line weight, clean closed contours, complete line borders, circular geometric design,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no gradients, white background, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  },
  intricate: {
    prefix: "vector line art coloring page for adults, fine detailed black outlines, intricate patterns, pure black ink on white paper, professional illustration, clean closed contours, complete line borders, distinct separated elements,",
    suffix: ", strictly monochrome, no colors, no shading, no grayscale, no filled areas, no shadows, no gradients, white background, every contour is a fully sealed closed loop with no openings, every shape has complete connected borders including all background elements like trees mountains clouds, no broken lines, no open strokes, no gaps between any lines, all regions are fully enclosed for flood-fill coloring"
  }
};

const PLAN_LIMITS = {
  free: 2,
  starter: 60,
  pro: 300,
  business: 1000,
};

// Reference image: 5 credits flat
const REFERENCE_COST = 5;
function getReferenceCost(): number {
  return REFERENCE_COST;
}

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
    fal.config({ credentials: process.env.FAL_KEY! });
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
    if (moderationDecision === 'deny' || moderationDecision === 'flag') {
      return NextResponse.json({ error: 'Your prompt could not be processed. Please revise and try again.' }, { status: 400 });
    }

    const { data: subData } = await supabase.from('subscriptions').select('plan, status').eq('user_id', userId).single();
    let plan = 'free';
    if (subData && subData.status === 'active') { plan = subData.plan || 'free'; }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase.from('user_usage').select('pages_used').eq('user_id', userId).eq('month', currentMonth).single();
    const pagesUsed = usageData?.pages_used || 0;
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 2;
    let creditCost = referenceImageUrl ? getReferenceCost() : 1;

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
          await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: 0, plan, ref_trial_used: true });
        }
      } else {
        if (usageData) {
          await supabase.from('user_usage').update({ pages_used: pagesUsed + creditCost, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
        } else {
          await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: creditCost, plan });
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

    // ===== Text-to-image: flux/schnell (fast, under 10s) =====
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: { prompt: fullPrompt, image_size: 'portrait_4_3', num_images: 1 },
    });

    const tempImageUrl = result.data?.images?.[0]?.url;
    if (!tempImageUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // Try to download and upload to Supabase Storage
    let permanentUrl = tempImageUrl;
    let storagePath: string | null = null;
    let storageFailed = false;

    try {
      const imageResponse = await fetch(tempImageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const timestamp = Date.now();
      const responseContentType = imageResponse.headers.get('content-type') || 'image/png';
      const fileExt = responseContentType.includes('webp') ? 'webp' : 'png';
      const filePath = `${userId}/${style}-${timestamp}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('coloring-pages').upload(filePath, imageBuffer, { contentType: responseContentType, upsert: false });
      if (uploadError) { console.error('[Storage] Upload failed:', uploadError); storageFailed = true; }
      else {
        const { data: urlData } = supabase.storage.from('coloring-pages').getPublicUrl(filePath);
        permanentUrl = urlData.publicUrl;
        storagePath = filePath;
      }
    } catch (storageErr) { console.error('[Storage] Upload exception:', storageErr); storageFailed = true; }

    // Deduct credits (text-to-image always costs 1)
    if (usageData) {
      await supabase.from('user_usage').update({ pages_used: pagesUsed + creditCost, plan, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('month', currentMonth);
    } else {
      await supabase.from('user_usage').insert({ user_id: userId, month: currentMonth, pages_used: creditCost, plan });
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
