'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Gift, Copy, Check, Share2, Users, X } from 'lucide-react';

interface InviteInfo {
  inviteCode: string;
  inviteUrl: string;
  monthlyCount: number;
  monthlyLimit: number;
  totalInvited: number;
  totalCreditsEarned: number;
  canInvite: boolean;
}

export function InvitePanel() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && isSignedIn && !info) {
      setLoading(true);
      fetch('/api/invite')
        .then(res => res.json())
        .then(data => {
          setInfo(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [open, isSignedIn, info]);

  const handleCopy = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = info.inviteUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!info) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'PixCraftX — AI Coloring Pages',
          text: `Create beautiful coloring pages with AI! Use my invite link and we both get 5 bonus credits 🎨`,
          url: info.inviteUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  if (!isSignedIn) return null;

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-[#FFB800] transition-colors"
        title="Invite & Earn"
      >
        <Gift className="w-4 h-4" />
        <span className="hidden lg:inline text-xs font-semibold">Invite</span>
      </button>

      {/* 弹窗 */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl border border-border max-w-md w-full mx-4 p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#FFB800]/15 mb-3">
                <Gift className="w-7 h-7 text-[#FFB800]" />
              </div>
              <h3 className="font-display text-xl text-foreground">Invite Friends, Earn Credits</h3>
              <p className="text-sm text-muted-foreground mt-1">Both you and your friend get 5 bonus credits!</p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : info ? (
              <>
                {/* 邀请链接 */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    Your Invite Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={info.inviteUrl}
                      className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-sm text-foreground font-mono truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        copied
                          ? 'bg-green-100 text-green-700'
                          : 'bg-[#FFB800] text-[#1A1A2E] hover:bg-[#FFB800]/90'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Invite code: <span className="font-mono font-semibold text-foreground">{info.inviteCode}</span>
                  </p>
                </div>

                {/* 分享按钮 */}
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border border-[#FFB800]/40 text-[#1A1A2E] hover:bg-[#FFB800]/10 transition-colors mb-4"
                >
                  <Share2 className="w-4 h-4" />
                  Share Invite Link
                </button>

                {/* 统计 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-3.5 h-3.5 text-[#2ECC71]" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{info.totalInvited}</p>
                    <p className="text-[10px] text-muted-foreground">Invited</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Gift className="w-3.5 h-3.5 text-[#FFB800]" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{info.totalCreditsEarned}</p>
                    <p className="text-[10px] text-muted-foreground">Credits Earned</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/30">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-[10px]">📅</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{info.monthlyCount}/{info.monthlyLimit}</p>
                    <p className="text-[10px] text-muted-foreground">This Month</p>
                  </div>
                </div>

                {!info.canInvite && (
                  <p className="text-xs text-amber-600 text-center mt-3">
                    Monthly invite limit reached. Resets next month.
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">Failed to load invite info</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
