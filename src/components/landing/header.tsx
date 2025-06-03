
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'; // Corrected import
import { Menu, BookOpenText, Rocket, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

export function Header() {
  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/blog', label: 'Blog' },
    // { href: '#faq', label: 'FAQ' }, // FAQ can be added later
  ];

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3, // Stagger animation
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
          <BookOpenText className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold text-foreground">StudyTrack</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <motion.div variants={buttonVariants} initial="hidden" animate="visible" custom={1}>
            <Button
              variant="outline"
              asChild
              className={cn(
                "py-2.5 px-5 text-sm rounded-2xl border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary",
                "hover:scale-105 transform transition-all duration-300 ease-out font-semibold shadow-sm hover:shadow-primary/20"
              )}
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Log In
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={buttonVariants} initial="hidden" animate="visible" custom={2}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    className={cn(
                      "py-2.5 px-5 text-sm rounded-2xl font-semibold shadow-lg text-primary-foreground",
                      "bg-gradient-to-r from-primary to-accent",
                      "hover:from-primary/90 hover:to-accent/90 hover:scale-105 hover:shadow-primary/40 dark:hover:shadow-accent/40",
                      "transform transition-all duration-300 ease-out"
                    )}
                  >
                    <Link href="/signup">
                      <Rocket className="mr-2 h-4 w-4" />
                      Get Started Free
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Join StudyTrack and ace your exams!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs bg-background p-0">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <Link href="/" className="flex items-center gap-2 mb-2">
                   <BookOpenText className="h-7 w-7 text-primary" />
                  <span className="font-headline text-2xl font-bold text-foreground">StudyTrack</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-1 p-4 text-lg font-medium flex-grow">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.label}>
                    <Link
                      href={link.href}
                      className="px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted rounded-md"
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3 p-6 border-t">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    asChild
                    className={cn(
                      "w-full py-2.5 px-5 rounded-2xl border-2 border-primary text-primary hover:bg-primary/10"
                    )}
                  >
                    <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" /> Log In
                    </Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button
                    asChild
                    className={cn(
                      "w-full py-2.5 px-5 rounded-2xl text-primary-foreground",
                      "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                    )}
                  >
                    <Link href="/signup">
                      <Rocket className="mr-2 h-4 w-4" /> Get Started Free
                    </Link>
                  </Button>
                </SheetClose>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
