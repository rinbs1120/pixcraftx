import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Coloring Pages',
  description: 'Browse and download free printable coloring pages for kids and adults. Dinosaurs, unicorns, mandalas, and more!',
  openGraph: {
    title: 'Free Coloring Pages - PixCraftX',
    description: 'Browse and download free printable coloring pages for kids and adults.',
    url: 'https://pixcraftx.com/free-coloring-pages',
    siteName: 'PixCraftX',
    type: 'website',
  },
  alternates: {
    canonical: 'https://pixcraftx.com/free-coloring-pages',
  },
};

export default function FreeColoringPagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
