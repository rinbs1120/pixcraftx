import { Webhook } from '@creem_io/nextjs';
import { createClient } from '@supabase/supabase-js';

const isTestMode = process.env.NEXT_PUBLIC_CREEM_TEST_MODE === 'true';

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
    const userId = metadata?.referenceId || metadata?.userId || customer.userId;
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

    // 更新user_usage表
    const { data: existingUsage } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .single();

    if (existingUsage) {
      await supabase
        .from('user_usage')
        .update({ plan, updated_at: new Date().toISOString() })
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
    const userId = metadata?.referenceId || metadata?.userId || customer.userId;
    console.log(`[Creem] Grant access for user: ${userId}, email: ${customer.email}`);
  },

  onRevokeAccess: async ({ customer, metadata }) => {
    if (!customer) return;
    const userId = metadata?.referenceId || metadata?.userId || customer.userId;
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
