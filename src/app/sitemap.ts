import { MetadataRoute } from 'next';
import { themes } from '@/data/coloring-themes';

export default function sitemap(): MetadataRoute.Sitemap {
  const themePages = themes.map((theme) => ({
    url: `https://pixcraftx.com/${theme.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://pixcraftx.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: 'https://pixcraftx.com/generate',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://pixcraftx.com/pricing',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://pixcraftx.com/faq',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://pixcraftx.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    ...themePages,
  ];
}
