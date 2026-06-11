import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { CursorTrail } from '@/components/cursor-trail';
import { RefHandler } from '@/components/ref-handler';
import './globals.css';

export const metadata: Metadata = {
  verification: { other: { "p:domain_verify": "88a5b8cbaf6eb49fa1682d7ee76f0525" } },
  title: {
    default: 'PixCraftX — Color It, Then Make It Yours',
    template: '%s | PixCraftX',
  },
  description:
    'AI-powered coloring page and merch creator. Generate line art, color with AI styles, then turn it into fridge magnets, stickers, and canvas prints.',
  keywords: [
    'coloring pages',
    'AI coloring',
    'fridge magnet maker',
    'sticker maker',
    'printable coloring pages',
    'coloring page generator',
    'merch creator',
  ],
  authors: [{ name: 'PixCraftX Team', url: 'https://pixcraftx.com' }],
  generator: 'PixCraftX',
  openGraph: {
    title: 'PixCraftX — Color It, Then Make It Yours',
    description:
      'AI-powered coloring page and merch creator. Generate line art, color it, then turn it into fridge magnets, stickers, and canvas prints.',
    url: 'https://pixcraftx.com',
    siteName: 'PixCraftX',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixCraftX — Color It, Then Make It Yours',
    description:
      'AI-powered coloring page and merch creator. Generate line art, color it, then turn it into fridge magnets, stickers, and canvas prints.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased">
          {children}
          <CursorTrail />
          <RefHandler />
        </body>
      </html>
    </ClerkProvider>
  );
}
