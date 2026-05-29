import { Webhook } from '@creem_io/nextjs';
import { createClient } from '@supabase/supabase-js';

const PRODUCT_PLAN_MAP: Record<string, string> = {
  'prod_7n0brGEbo1u1yDHsf1gI8r': 'starter',  // $4.99/月
  'prod_15GyxRDvbgQAS0FFKb8ayp': 'pro',       // $9.99/月
  'prod_3i1ndQTCMKtqaswpGDLwWM': 'business',  // $19.99/月
};

export const POST = Webhook({
  webhookSecret: process.env.CREEM_WEBHOOK_SECRET!,
  onCheckoutCompleted: async ({ customer, product, metadata }) => {
    console.log(`[Creem] Checkout completed: ${customer.email} purchased ${product.name}`);
    
    const plan = PRODUCT_PLAN_MAP[product.id];
    if (!plan) {
      console.error(`[Creem] Unknown product ID: ${product.id}`);
      return;
    }

    // 用referenceId（即Clerk userId）或email匹配用户
    const userId = metadata?.referenceId as string | undefined;
    if (!userId) {
      console.error('[Creem] No referenceId in metadata, cannot update user plan');
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const currentMonth = new Date().toISOString().slice(0, 7);

    // 更新用户当月usage记录的plan字段
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

    // 保存订阅信息到单独表（用于管理取消/续费）
    await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        creem_customer_id: customer.id,
        plan,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    console.log(`[Creem] User ${userId} plan updated to ${plan}`);
  },

  onGrantAccess: async ({ customer, metadata }) => {
    const userId = metadata?.referenceId as string;
    console.log(`[Creem] Grant access for user: ${userId}, email: ${customer.email}`);
  },

  onRevokeAccess: async ({ customer, metadata }) => {
    const userId = metadata?.referenceId as string;
    console.log(`[Creem] Revoke access for user: ${userId}`);

    if (!userId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 将plan降回free
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
