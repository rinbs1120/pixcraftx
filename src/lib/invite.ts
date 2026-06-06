/**
 * 邀请机制工具函数
 * - invite code: 用户Clerk ID的短编码（8字符）
 * - 规则: 双方各得5积分, 每月上限10人
 */

const INVITE_CREDITS = 5;
const MONTHLY_INVITE_LIMIT = 10;

/** 将Clerk ID编码为8字符短码 */
export function encodeInviteCode(userId: string): string {
  // 简单hash: 用userId的前8个字符的charCode做异或混淆
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉容易混淆的0/O/1/I
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[(hash + i * 7) % chars.length];
  }
  return code;
}

/** 生成邀请链接 */
export function getInviteUrl(code: string): string {
  return `https://pixcraftx.com/?ref=${code}`;
}

export { INVITE_CREDITS, MONTHLY_INVITE_LIMIT };
