import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const PLAN_LIMITS = {
  free: 5,
  starter: 100,
  pro: 500,
  business: 2000,
};

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 优先从subscriptions表获取plan（更可靠）
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

    return NextResponse.json({
      plan,
      pagesUsed,
      limit,
      remaining: Math.max(0, limit - pagesUsed),
    });
  } catch (error) {
    console.error('[Usage] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
