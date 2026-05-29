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
  // 调试：检查环境变量是否加载
  console.log('FAL_KEY exists:', !!process.env.FAL_KEY);
  console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
  console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // 初始化客户端（在请求时才读取环境变量）
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

    // 3. 检查用户额度
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-05"
    const { data: usageData } = await supabase
      .from('user_usage')
      .select('pages_used, plan')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const pagesUsed = usageData?.pages_used || 0;
    const plan = usageData?.plan || 'free';
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

    const imageUrl = result.data?.images?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
    }

    // 6. 更新用户使用量
    if (usageData) {
      await supabase
        .from('user_usage')
        .update({ pages_used: pagesUsed + 1, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('month', currentMonth);
    } else {
      await supabase
        .from('user_usage')
        .insert({ user_id: userId, month: currentMonth, pages_used: 1, plan: 'free' });
    }

    // 7. 记录生成历史
    await supabase
      .from('generation_history')
      .insert({
        user_id: userId,
        prompt: prompt.trim(),
        style,
        image_url: imageUrl
      });

    // 8. 返回结果
    return NextResponse.json({
      imageUrl,
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
