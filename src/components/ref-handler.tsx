'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useRef } from 'react';

/**
 * 处理邀请链接ref参数
 * 1. 检测URL中的?ref=参数
 * 2. 存入cookie（30天有效）
 * 3. 用户登录后自动兑换
 */
export function RefHandler() {
  const { isSignedIn, isLoaded } = useAuth();
  const hasRedeemed = useRef(false);

  useEffect(() => {
    // 检测URL中的ref参数
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // 存入cookie（30天）
      document.cookie = `pixcraftx_ref=${refCode};path=/;max-age=${30 * 24 * 3600};SameSite=Lax`;
      // 清理URL中的ref参数（避免分享时暴露）
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    // 用户已登录且还没兑换过
    if (isLoaded && isSignedIn && !hasRedeemed.current) {
      const cookies = document.cookie.split(';');
      const refCookie = cookies.find(c => c.trim().startsWith('pixcraftx_ref='));

      if (refCookie) {
        const refCode = refCookie.trim().split('=')[1];
        hasRedeemed.current = true;

        fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refCode }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              // 兑换成功，清除cookie
              document.cookie = 'pixcraftx_ref=;path=/;max-age=0';
              console.log('[Ref] Invite code redeemed successfully');
            } else if (data.alreadyRedeemed) {
              // 已兑换过，清除cookie
              document.cookie = 'pixcraftx_ref=;path=/;max-age=0';
            } else {
              console.log('[Ref] Redemption failed:', data.error);
              // 不清除cookie，等下次登录再试
              hasRedeemed.current = false;
            }
          })
          .catch(() => {
            hasRedeemed.current = false;
          });
      }
    }
  }, [isLoaded, isSignedIn]);

  return null;
}
