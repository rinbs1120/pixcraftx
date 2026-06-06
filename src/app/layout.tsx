import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { CursorTrail } from '@/components/cursor-trail';
import { RefHandler } from '@/components/ref-handler';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PixCraftX — Create Any Coloring Page in Seconds',
    template: '%s | PixCraftX',
  },
  description:
    'AI-powered coloring page generator that creates printable coloring pages in seconds. For parents, teachers, and KDP sellers.',
  keywords: [
    'coloring pages',
    'AI coloring',
    'printable coloring pages',
    'kids coloring',
    'mandala coloring',
    'KDP coloring books',
    'coloring page generator',
  ],
  authors: [{ name: 'PixCraftX Team', url: 'https://pixcraftx.com' }],
  generator: 'PixCraftX',
  openGraph: {
    title: 'PixCraftX — Create Any Coloring Page in Seconds',
    description:
      'AI-powered coloring page generator. Describe your idea or upload a photo, get print-ready coloring pages.',
    url: 'https://pixcraftx.com',
    siteName: 'PixCraftX',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixCraftX — Create Any Coloring Page in Seconds',
    description:
      'AI-powered coloring page generator. Describe your idea or upload a photo, get print-ready coloring pages.',
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
