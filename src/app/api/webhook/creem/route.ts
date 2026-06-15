import { Webhook } from '@creem_io/nextjs';
import { createClient } from '@supabase/supabase-js';

const isTestMode = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

// Plan tier ranking for upgrade detection
const PLAN_RANK: Record<string, number> = { free: 0, starter: 1, pro: 2, business: 3 };

const PRODUCT_PLAN_MAP: Record<string, string> = isTestMode
  ? {
      'prod_7lVPw6BIdARHnHp0q8NUq': 'starter',
      'prod_5Ys18YHDcghSmzQiH34m1F': 'pro',
      'prod_6Ce4UEHVAHQuKD8rXeqrHJ': 'business',
    }
  : {
      'prod_7n0brGEbo1u1yDHsf1gI8r': 'starter',
      'prod_15GyxRDvbgQAS0FFKb8ayp': 'pro',
      'prod_3i1ndQTCMKtqaswpGDLwWM': 'business',
    };

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  onCheckoutCompleted: async ({ customer, product, metadata }) => {
    if (!customer || !product) return;
    console.log(`[Creem] Checkout completed: ${customer.email} purchased ${product.name}`);
    console.log(`[Creem] Full metadata:`, JSON.stringify(metadata));
    
    const plan = PRODUCT_PLAN_MAP[product.id];
    if (!plan) {
      console.error(`[Creem] Unknown product ID: ${product.id}`);
      return;
    }

    // 尝试多种方式获取userId
    const userId = metadata?.referenceId || metadata?.userId;
    if (!userId) {
      console.error('[Creem] No userId found in metadata or customer, cannot update user plan');
      return;
    }

    console.log(`[Creem] Updating user ${userId} to plan ${plan}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const currentMonth = new Date().toISOString().slice(0, 7);

    // 检查是否为升级（plan tier提升）
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .single();
    const oldPlan = existingSub?.plan || 'free';
    const isUpgrade = (PLAN_RANK[plan] || 0) > (PLAN_RANK[oldPlan] || 0);

    // 更新user_usage表 — 升级时重置已用额度为0
    const { data: existingUsage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (existingUsage) {
      const updateData: Record<string, any> = { plan, updated_at: new Date().toISOString() };
      if (isUpgrade) {
        updateData.pages_used = 0; // 升级重置额度
        console.log(`[Creem] Upgrade detected: ${oldPlan} → ${plan}, resetting monthly usage to 0`);
      }
      await supabase
        .from('user_usage')
        .update(updateData)
        .eq('user_id', userId)
        .eq('month', currentMonth);
    } else {
      await supabase
        .from('user_usage')
        .insert({ user_id: userId, month: currentMonth, pages_used: 0, plan });
    }

    // 更新subscriptions表
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        creem_customer_id: customer.id,
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.log(`[Creem] User ${userId} plan updated to ${plan} ✅`);
  },

  onGrantAccess: async ({ customer, metadata }) => {
    if (!customer) return;
    const userId = metadata?.referenceId || metadata?.userId;
    console.log(`[Creem] Grant access for user: ${userId}, email: ${customer.email}`);
  },

  onRevokeAccess: async ({ customer, metadata }) => {
    if (!customer) return;
    const userId = metadata?.referenceId || metadata?.userId;
    console.log(`[Creem] Revoke access for user: ${userId}`);

    if (!userId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const currentMonth = new Date().toISOString().slice(0, 7);
    await supabase
      .from('user_usage')
      .update({ plan: 'free', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('month', currentMonth);

    await supabase
      .from('subscriptions')
      .update({ status: 'canceled', plan: 'free', updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    console.log(`[Creem] User ${userId} access revoked, plan set to free`);
  },
});
