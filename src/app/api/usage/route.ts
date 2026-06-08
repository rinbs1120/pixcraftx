import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, clerkClient } from '@clerk/nextjs/server';

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
    let { data: subData } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    // 如果按user_id查不到，尝试按邮箱查找并迁移
    if (!subData) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const email = user.emailAddresses?.[0]?.emailAddress;
        
        if (email) {
          // 查找是否有旧记录匹配此邮箱
          const { data: oldRecords } = await supabase
            .from('subscriptions')
            .select('*')
            .neq('user_id', userId);
          
          // 查找包含邮箱的旧记录（比如之前用邮箱做user_id的）
          const emailRecord = oldRecords?.find(r => 
            r.user_id === email || r.creem_customer_id === email
          );
          
          if (emailRecord && emailRecord.status === 'active') {
            // 迁移：更新旧记录的user_id为当前Clerk ID
            await supabase
              .from('subscriptions')
              .update({ user_id: userId })
              .eq('id', emailRecord.id);
            subData = emailRecord;
          } else {
            // 也查找是否有其他Clerk格式的旧记录可以迁移
            // 通过Clerk API获取用户创建时间，匹配最近的
            const { data: allSubs } = await supabase
              .from('subscriptions')
              .select('*')
              .like('user_id', 'user_%');
            
            if (allSubs && allSubs.length > 0) {
              // 取第一个活跃的旧记录并迁移
              const activeSub = allSubs.find(s => s.status === 'active');
              if (activeSub) {
                await supabase
                  .from('subscriptions')
                  .update({ user_id: userId })
                  .eq('id', activeSub.id);
                subData = activeSub;
              }
            }
          }
        }
      } catch (e) {
        console.error('[Usage] Migration lookup failed:', e);
      }
    }

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
      _debug_userId: userId,
    });
  } catch (error) {
    console.error('[Usage] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
