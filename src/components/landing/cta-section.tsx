
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export function CtaSection() {
  return (
    <section id="cta" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-t from-background to-secondary/30">
      <div className="grid items-center justify-center gap-6 px-4 md:px-6 text-center"> {/* Removed 'container' class */}
        <div className="space-y-4">
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
                Get Started
            </div>
          <h2 className="font-headline text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl text-foreground">
            Ready to Supercharge Your Studies?
          </h2>
          <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl lg:text-lg xl:text-xl">
            Join thousands of students achieving their exam goals with StudyTrack.
            Sign up now and start for free.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm space-y-2">
          <Button size="lg" asChild className="w-full shadow-lg hover:shadow-primary/50 transition-shadow">
            <Link href="/signup">
              Sign Up Now and Start For Free
              <Rocket className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
