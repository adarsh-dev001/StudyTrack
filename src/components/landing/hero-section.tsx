
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-20 lg:py-28 xl:py-32 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-1 lg:items-center xl:grid-cols-[1fr_minmax(0,_550px)] xl:gap-12">
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6 text-center lg:text-left">
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-foreground">
                Ace Your Competitive Exams with <span className="text-primary">StudyTrack</span>
              </h1>
              <p className="max-w-[600px] text-muted-foreground text-sm sm:text-base md:text-lg xl:text-xl mx-auto lg:mx-0">
                Your all-in-one study planner, productivity tracker, and AI-powered learning assistant.
                Tailored for NEET, UPSC, JEE, and more.
              </p>
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" asChild className="shadow-lg hover:shadow-primary/50 transition-shadow text-sm sm:text-base">
                <Link href="/signup">
                  Get Started For Free
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-sm sm:text-base">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
          </div>
          <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-lg lg:aspect-[4/3] xl:aspect-video mt-6 lg:mt-0">
            <Image
              src="https://eduauraapublic.s3.ap-south-1.amazonaws.com/webassets/images/blogs/effective-study-plan.jpg"
              alt="Effective Study Plan Illustration"
              layout="fill"
              objectFit="cover"
              className="rounded-xl shadow-2xl"
              data-ai-hint="study plan"
              priority // Added priority
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
