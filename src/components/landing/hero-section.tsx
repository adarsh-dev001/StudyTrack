
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-b from-background to-secondary/30">
      <div className="px-4 md:px-6"> {/* Removed 'container' class */}
        <div className="grid gap-6 lg:grid-cols-[1fr_550px] lg:gap-12 xl:grid-cols-[1fr_650px]">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                Ace Your Competitive Exams with <span className="text-primary">StudyTrack</span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
                Your all-in-one study planner, productivity tracker, and AI-powered learning assistant.
                Tailored for NEET, UPSC, JEE, and more.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow">
                <Link href="/signup">
                  Get Started For Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-video overflow-hidden rounded-xl lg:aspect-[4/3] xl:aspect-video">
            <Image
              src="https://placehold.co/650x400.pnghttps://cdn1.byjus.com/wp-content/uploads/blog/2022/05/12204745/Exam-Mindset_blog-banner-2.https://assets.skyfilabs.com/images/blog/top-competetive-exams-for-engineering-students.webp"
              alt="StudyTrack Dashboard Preview"
              layout="fill"
              objectFit="cover"
              className="rounded-xl shadow-2xl"
              data-ai-hint="student dashboard"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
