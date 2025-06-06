
import Link from 'next/link';
import React from 'react'; // Added React import
import { BookOpenText } from 'lucide-react';

function FooterComponent() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-between gap-6 py-10 md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Link href="/" className="flex items-center gap-2">
            <BookOpenText className="h-6 w-6 text-primary" />
            <p className="text-center font-headline text-lg font-bold md:text-left text-foreground">
              StudyTrack
            </p>
          </Link>
        </div>
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {currentYear} StudyTrack. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

export const Footer = React.memo(FooterComponent);
