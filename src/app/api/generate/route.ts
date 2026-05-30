import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

// 风格对应的prompt修饰
const STYLE_PROMPTS = {
  kids: {
    prefix: "black and white coloring page for kids, bold thick outlines, simple shapes, clean line art,",
    suffix: ", no shading, no grayscale, no color, white background, large areas to color, cartoon style"
  },
  mandala: {
    prefix: "black and white mandala coloring page, symmetrical circular pattern, intricate line art,",
    suffix: ", no shading, no grayscale, no color, white background, zen pattern, repetitive geometric shapes"
  },
  detailed: {
    prefix: "black and white detailed coloring page for adults, fine lines, intricate details, realistic proportions,",
    suffix: ", no shading, no grayscale, no color, white background, complex elaborate design, professional illustration"
  }
};

// 额度限制
const PLAN_LIMITS = {
  free: 5,
  starter: 100,
  pro: 500,
  business: 2000,
};

export async function POST(req: NextRequest) {
  try {
    // 初始化客户端
    fal.config({ credentials: process.env.FAL_KEY! });
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 1. 验证用户身份
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to generate coloring pages' }, { status: 401 });
    }

    // 2. 获取请求参数
    const { prompt, style = 'kids' } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a description' }, { status: 400 });
    }
    if (prompt.length > 500) {
      return NextResponse.json({ error: 'Description too long (max 500 characters)' }, { status: 400 });
    }

    // 3. 检查用户套餐 - 优先查subscriptions表
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    let plan = 'free';
    if (subData && subData.status === 'active') {
      plan = subData.plan || 'free';
    }

    // 获取本月使用量
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('pages_used')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const pagesUsed = usageData?.pages_used || 0;
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 5;

    if (pagesUsed >= limit) {
      return NextResponse.json({ 
        error: 'Monthly limit reached', 
        limit, 
        used: pagesUsed,
        plan 
      }, { status: 429 });
    }

    // 4. 构建涂色页专用Prompt
    const styleConfig = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] || STYLE_PROMPTS.kids;
    const fullPrompt = `${styleConfig.prefix} ${prompt.trim()} ${styleConfig.suffix}`;

    // 5. 调用Fal.ai生成图片
    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'portrait_4_3',
        num_images: 1,
      },
    });

    const tempImageUrl = result.data?.images?.[0]?.url;
    if (!tempImageUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // 6. 下载图片并上传到Supabase Storage
    const imageResponse = await fetch(tempImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    
    const timestamp = Date.now();
    const filePath = `${userId}/${style}-${timestamp}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('coloring-pages')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Storage] Upload failed:', uploadError);
      return NextResponse.json({
        imageUrl: tempImageUrl,
        style,
        pagesUsed: pagesUsed + 1,
        limit,
        plan,
        storageWarning: 'Image stored temporarily, may expire',
      });
    }

    const { data: urlData } = supabase.storage
      .from('coloring-pages')
      .getPublicUrl(filePath);

    const permanentUrl = urlData.publicUrl;

    // 7. 更新用户使用量
    if (usageData) {
      await supabase
        .from('user_usage')
        .update({ pages_used: pagesUsed + 1, plan, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('month', currentMonth);
    } else {
      await supabase
        .from('user_usage')
        .insert({ user_id: userId, month: currentMonth, pages_used: 1, plan });
    }

    // 8. 记录生成历史
    await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        prompt: prompt.trim(),
        style,
        image_url: permanentUrl,
        storage_path: filePath,
      });

    // 9. 返回结果
    return NextResponse.json({
      imageUrl: permanentUrl,
      style,
      pagesUsed: pagesUsed + 1,
      limit,
      plan,
    });

  } catch (error) {
    console.error('Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
