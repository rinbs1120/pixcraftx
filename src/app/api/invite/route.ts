import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { encodeInviteCode, INVITE_CREDITS, MONTHLY_INVITE_LIMIT } from '@/lib/invite';

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

    const inviteCode = encodeInviteCode(userId);

    // 确保invitations表中有该用户的anchor记录（用于code→userId映射）
    const { data: anchor } = await supabase
      .from('invitations')
      .select('id')
      .eq('inviter_id', userId)
      .eq('invite_code', inviteCode)
      .eq('invitee_id', '__anchor__')
      .single();

    if (!anchor) {
      await supabase.from('invitations').insert({
        inviter_id: userId,
        invitee_id: '__anchor__',
        invite_code: inviteCode,
        status: 'anchor',
      });
    }

    // 获取本月成功邀请数
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: invitations } = await supabase
      .from('invitations')
      .select('id, invitee_id, created_at, status')
      .eq('inviter_id', userId)
      .eq('status', 'redeemed')
      .gte('redeemed_at', monthStart);

    const monthlyCount = invitations?.length || 0;

    // 全部成功邀请
    const { count: totalInvited } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', userId)
      .eq('status', 'redeemed');

    return NextResponse.json({
      inviteCode,
      inviteUrl: `https://pixcraftx.com/?ref=${inviteCode}`,
      monthlyCount,
      monthlyLimit: MONTHLY_INVITE_LIMIT,
      totalInvited: totalInvited || 0,
      totalCreditsEarned: (totalInvited || 0) * INVITE_CREDITS,
      canInvite: monthlyCount < MONTHLY_INVITE_LIMIT,
    });
  } catch (error) {
    console.error('[Invite] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refCode } = await req.json();
    if (!refCode || typeof refCode !== 'string') {
      return NextResponse.json({ error: 'Missing ref code' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 检查用户是否已经使用过邀请码
    const { data: existingRedemption } = await supabase
      .from('invitations')
      .select('id')
      .eq('invitee_id', userId)
      .eq('status', 'redeemed')
      .single();

    if (existingRedemption) {
      return NextResponse.json({ error: 'Already used an invite code', alreadyRedeemed: true }, { status: 400 });
    }

    // 不能用自己的邀请码
    const myCode = encodeInviteCode(userId);
    if (refCode === myCode) {
      return NextResponse.json({ error: 'Cannot use your own code' }, { status: 400 });
    }

    // 通过invite_code查anchor记录找到inviter_id
    const { data: anchorRecord } = await supabase
      .from('invitations')
      .select('inviter_id')
      .eq('invite_code', refCode)
      .eq('status', 'anchor')
      .single();

    if (!anchorRecord) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    const inviterId = anchorRecord.inviter_id;

    // 检查邀请人本月邀请上限
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: inviterMonthly } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', inviterId)
      .eq('status', 'redeemed')
      .gte('redeemed_at', monthStart);

    if ((inviterMonthly || 0) >= MONTHLY_INVITE_LIMIT) {
      return NextResponse.json({ error: 'Invite limit reached for this month' }, { status: 400 });
    }

    // 创建邀请记录
    const { error: insertError } = await supabase
      .from('invitations')
      .insert({
        inviter_id: inviterId,
        invitee_id: userId,
        invite_code: refCode,
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('[Invite] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to record invitation' }, { status: 500 });
    }

    // 给双方加积分——通过bonus_credits字段
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 邀请人加积分
    await addBonusCredits(supabase, inviterId, currentMonth, INVITE_CREDITS);
    // 被邀请人加积分
    await addBonusCredits(supabase, userId, currentMonth, INVITE_CREDITS);

    return NextResponse.json({
      success: true,
      message: `Welcome! You earned ${INVITE_CREDITS} bonus credits!`,
      creditsEarned: INVITE_CREDITS,
    });
  } catch (error) {
    console.error('[Invite] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function addBonusCredits(
  supabase: any,
  userId: string,
  month: string,
  credits: number
) {
  const { data: usage } = await supabase
    .from('user_usage')
    .select('bonus_credits')
    .eq('user_id', userId)
    .eq('month', month)
    .single();

  if (usage) {
    await supabase
      .from('user_usage')
      .update({ bonus_credits: (usage.bonus_credits || 0) + credits })
      .eq('user_id', userId)
      .eq('month', month);
  } else {
    await supabase
      .from('user_usage')
      .insert({
        user_id: userId,
        month,
        pages_used: 0,
        ref_trial_used: false,
        bonus_credits: credits,
      });
  }
}
