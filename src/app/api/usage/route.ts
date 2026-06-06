import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const PLAN_LIMITS = {
  free: 2,
  starter: 60,
  pro: 300,
  business: 1000,
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

    // 优先从subscriptions表获取plan
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
      .select('pages_used, ref_trial_used, bonus_credits')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    const pagesUsed = usageData?.pages_used || 0;
    const refTrialUsed = usageData?.ref_trial_used || false;
    const bonusCredits = usageData?.bonus_credits || 0;
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 2;
    const effectiveLimit = limit + bonusCredits;

    return NextResponse.json({
      plan,
      pagesUsed,
      limit,
      bonusCredits,
      effectiveLimit,
      remaining: Math.max(0, effectiveLimit - pagesUsed),
      refTrialUsed,
    });
  } catch (error) {
    console.error('[Usage] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
