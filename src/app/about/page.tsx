import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata = {
  title: 'About',
  description: 'Learn more about PixCraftX and our mission.',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl mb-8 text-center">
            About PixCraftX
          </h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              PixCraftX is an AI-powered coloring page and merch creator that helps parents, teachers,
              and creators bring their imagination to life — then turn it into real products.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We believe creativity should be accessible to everyone. Whether you&apos;re a parent
              looking for that perfect dinosaur coloring page your child dreamed up, a teacher
              creating themed worksheets, or a KDP seller building coloring books — PixCraftX
              makes it fast, easy, and affordable.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4">How It Works</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Using advanced AI, PixCraftX transforms your text descriptions into clean line art, applies colors and art styles with one click, then turns your colored art into real products — fridge magnets, stickers, and canvas prints. Our models are optimized for coloring pages with clear outlines and print-quality resolution, and our merch generator produces transparent PNGs ready for production.
            </p>

            <h2 className="font-display text-2xl mt-8 mb-4">Made With Love</h2>
            <p className="text-muted-foreground leading-relaxed">
              PixCraftX is built by a small team passionate about creativity and technology.
              We&apos;re constantly improving our AI models and adding new features based on your
              feedback.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
