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
              PixCraftX is an AI-powered coloring page generator that helps parents, teachers,
              and creators bring their imagination to life in seconds.
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
              Using advanced AI image generation, PixCraftX transforms your text descriptions into clean, print-ready line art. Go further with Auto Color to fill colors automatically, or apply art styles like Chubby Doodle and City Pop for creative transformations. Our models are specifically trained to create coloring pages — with clear outlines, appropriate detail levels, and print-quality resolution.
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
