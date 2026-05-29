import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ColorForge — Create Any Coloring Page in Seconds',
    template: '%s | ColorForge',
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
  authors: [{ name: 'ColorForge Team', url: 'https://pixcraftx.com' }],
  generator: 'ColorForge',
  openGraph: {
    title: 'ColorForge — Create Any Coloring Page in Seconds',
    description:
      'AI-powered coloring page generator. Type what you imagine, get print-ready line art.',
    url: 'https://pixcraftx.com',
    siteName: 'ColorForge',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ColorForge — Create Any Coloring Page in Seconds',
    description:
      'AI-powered coloring page generator. Type what you imagine, get print-ready line art.',
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
        </body>
      </html>
    </ClerkProvider>
  );
}
