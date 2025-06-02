
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="cta" className="w-full py-12 md:py-20 lg:py-28 bg-gradient-to-t from-background to-secondary/30">
      <div className="container mx-auto grid items-center justify-center gap-4 sm:gap-6 px-4 md:px-6 text-center">
        <div className="space-y-3 sm:space-y-4">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs sm:text-sm text-primary font-medium">
                Get Started
            </div>
          <h2 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-foreground">
            Ready to Supercharge Your Studies?
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground text-sm sm:text-base md:text-lg xl:text-xl">
            Join thousands of students achieving their exam goals with StudyTrack.
            Sign up now and start for free.
          </p>
        </div>
        <div className="mx-auto w-full max-w-xs sm:max-w-sm space-y-2">
          <Button size="lg" asChild className="w-full shadow-lg hover:shadow-primary/50 transition-shadow text-sm sm:text-base">
            <Link href="/signup">
              Sign Up Now and Start For Free
              <Rocket className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
