import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { themes, getThemeBySlug, getRelatedThemes } from '@/data/coloring-themes';

export const dynamicParams = false;

export function generateStaticParams() {
  return themes.map((theme) => ({ slug: theme.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) return {};

  return {
    title: theme.title,
    description: theme.metaDescription,
    keywords: theme.keywords,
    openGraph: {
      title: theme.title,
      description: theme.metaDescription,
      url: `https://pixcraftx.com/${theme.slug}`,
      siteName: 'PixCraftX',
      type: 'website',
      images: [
        {
          url: `https://pixcraftx.com${theme.samples[0]}`,
          width: 1200,
          height: 900,
          alt: theme.sampleAlts[0],
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: theme.title,
      description: theme.metaDescription,
      images: [`https://pixcraftx.com${theme.samples[0]}`],
    },
    alternates: {
      canonical: `https://pixcraftx.com/${theme.slug}`,
    },
  };
}

export default async function ThemePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const theme = getThemeBySlug(slug);
  if (!theme) notFound();

  const relatedThemesList = getRelatedThemes(theme.relatedThemes);

  const webpageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: theme.title,
    description: theme.metaDescription,
    url: `https://pixcraftx.com/${theme.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'PixCraftX',
      url: 'https://pixcraftx.com',
    },
  };

  const creativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: theme.title,
    description: theme.metaDescription,
    genre: 'Coloring Page',
    audience: {
      '@type': 'PeopleAudience',
      suggestedMinAge: 3,
    },
    about: {
      '@type': 'Thing',
      name: theme.category,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'PixCraftX',
        item: 'https://pixcraftx.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Free Coloring Pages',
        item: 'https://pixcraftx.com/free-coloring-pages',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: theme.h1,
        item: `https://pixcraftx.com/${theme.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <nav className="container mx-auto px-4 md:px-6 max-w-6xl pt-24 pb-4">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-primary transition-colors">
                PixCraftX
              </Link>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li>
              <Link href="/free-coloring-pages" className="hover:text-primary transition-colors">
                Free Coloring Pages
              </Link>
            </li>
            <li className="text-muted-foreground/50">/</li>
            <li className="text-foreground font-medium">{theme.h1}</li>
          </ol>
        </nav>

        {/* Hero + CTA */}
        <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-8">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-4">
            {theme.h1}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-8">
            {theme.metaDescription}
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href={`/color?src=${encodeURIComponent(`https://pixcraftx.com${theme.samples[0]}`)}`}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-base transition-all hover:translate-y-0.5 border-2 border-[#FFB800] text-[#1A1A2E] bg-white hover:bg-[#FFF8E1]"
            >
              {/* Colorful Palette Icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.1 0 2-.9 2-2 0-.5-.18-.96-.5-1.33-.3-.35-.5-.81-.5-1.33 0-1.1.9-2 2-2h2.36C19.86 15.34 22 13.13 22 10c0-4.42-4.48-8-10-8z" fill="#F5F0E8" stroke="#1A1A2E" strokeWidth="1.5"/>
                <circle cx="8" cy="9" r="1.8" fill="#FF6B6B"/>
                <circle cx="12" cy="6.5" r="1.8" fill="#FFB800"/>
                <circle cx="16" cy="9" r="1.8" fill="#2ECC71"/>
                <circle cx="7.5" cy="13" r="1.8" fill="#9B59B6"/>
                <circle cx="16.5" cy="13" r="1.8" fill="#3498DB"/>
              </svg>
              Color Online
            </a>
            <a
              href="/generate"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-base transition-all hover:translate-y-0.5 text-[#1A1A2E]"
              style={{
                background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Generate Your Own
            </a>
          </div>
        </section>

        {/* Sample Images Grid - simplified: only Download Free per card */}
        <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {theme.samples.map((sample, index) => (
              <div
                key={sample}
                className="group bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-[4/3] bg-white">
                  <Image
                    src={sample}
                    alt={theme.sampleAlts[index]}
                    fill
                    className="object-contain p-4"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <a
                    href={sample}
                    download
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full font-semibold text-sm transition-all hover:translate-y-0.5 text-[#1A1A2E]"
                    style={{
                      background: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
                      boxShadow: '0 2px 8px rgba(255,184,0,0.3)',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download Free
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SEO Description */}
        <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-16">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl text-foreground mb-4">
              About Our {theme.h1}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {theme.description}
            </p>
          </div>
        </section>

        {/* Related Themes */}
        {relatedThemesList.length > 0 && (
          <section className="container mx-auto px-4 md:px-6 max-w-6xl pb-20">
            <h2 className="font-display text-2xl text-foreground mb-6">
              More Coloring Pages You&apos;ll Love
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedThemesList.map((related) => (
                <Link
                  key={related.slug}
                  href={`/${related.slug}`}
                  className="group flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-border">
                    <Image
                      src={related.samples[0]}
                      alt={related.sampleAlts[0]}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {related.h1}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {related.category}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
