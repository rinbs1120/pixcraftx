'use client';

import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';

const MESSAGES = [
  '🎉 Invite friends & earn 5 credits each!',
  '🎁 Share your link — both get 5 bonus credits!',
  '✨ Up to 10 invites per month — start sharing now!',
];

export function InviteBanner() {
  const [visible, setVisible] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MESSAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 w-full bg-gradient-to-r from-[#FFB800]/10 via-[#FFD666]/10 to-[#E8D5A0]/10 border-b border-[#FFB800]/20 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-2 flex items-center justify-center gap-2">
        <Megaphone className="w-4 h-4 text-[#FFB800] flex-shrink-0" />
        <div className="overflow-hidden relative h-5">
          <p
            key={msgIndex}
            className="text-xs md:text-sm font-medium text-foreground whitespace-nowrap animate-slide-up"
          >
            {MESSAGES[msgIndex]}
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
