
'use client';

import Link from 'next/link';
import React from 'react'; // Added React import
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, BookOpenText, Rocket, LogIn, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

function HeaderComponent() {
  const navLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/blog', label: 'Blog' },
  ];

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  // Effect to handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect for initializing and updating theme
  useEffect(() => {
    if (!mounted) return; // Only run on client after mount

    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mounted]);

  // Effect for theme state changes
  useEffect(() => {
    if (!mounted) return;

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.3, 
        duration: 0.4,
        ease: "easeOut"
      }
    })
  };

  const ThemeToggleButton = ({ isMobile = false }: { isMobile?: boolean }) => {
    if (!mounted) {
      // Render a placeholder or null on the server / before mount to avoid hydration issues
      return <div style={{ width: isMobile ? '100%' : '40px', height: isMobile ? '40px' : '40px' }} />;
    }
    return (
      <Button
        variant="ghost"
        size={isMobile ? "default" : "icon"}
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className={cn(isMobile ? "w-full justify-start px-3 py-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-md text-lg" : "h-10 w-10", "transition-colors")}
      >
        {theme === 'light' ? <Moon className={cn("h-5 w-5", isMobile && "mr-2")} /> : <Sun className={cn("h-5 w-5", isMobile && "mr-2")} />}
        {isMobile && (<span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>)}
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
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
              className="text-muted-foreground transition-colors hover:text-primary hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-3">
            <motion.div variants={buttonVariants} initial="hidden" animate="visible" custom={1}>
              <Button
                variant="outline"
                asChild
                className={cn(
                  "py-2.5 px-5 text-sm rounded-2xl border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary hover:shadow-md",
                  "hover:scale-105 transform transition-all duration-300 ease-out font-semibold shadow-sm"
                )}
              >
                <Link href="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </Link>
              </Button>
            </motion.div>
            <motion.div 
              variants={buttonVariants} 
              initial="hidden" 
              animate="visible" 
              custom={2}
              className="relative" 
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <motion.div 
                      animate={{ scale: [1, 1.02, 1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
                    >
                      <Button
                        asChild
                        className={cn(
                          "py-2.5 px-5 text-sm rounded-2xl font-semibold shadow-lg text-primary-foreground",
                          "bg-gradient-to-r from-primary to-accent",
                          "hover:from-primary/90 hover:to-accent/90 hover:scale-105 hover:shadow-xl",
                          "transform transition-all duration-300 ease-out"
                        )}
                      >
                        <Link href="/signup">
                          <Rocket className="mr-2 h-4 w-4" />
                          Get Started Free
                        </Link>
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join StudyTrack and ace your exams!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>

          <div className="hidden md:block">
            <ThemeToggleButton />
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
                        className="px-3 py-2 text-muted-foreground transition-colors hover:text-primary hover:bg-muted hover:underline rounded-md"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                     <ThemeToggleButton isMobile={true} />
                  </SheetClose>
                </nav>
                <div className="mt-auto flex flex-col gap-3 p-6 border-t">
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      asChild
                      className={cn(
                        "w-full py-2.5 px-5 rounded-2xl border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary hover:shadow-md",
                        "hover:scale-105 hover:shadow-md transform transition-all duration-300 ease-out"
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
                        "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90",
                         "hover:scale-105 hover:shadow-lg transform transition-all duration-300 ease-out"
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
      </div>
    </header>
  );
}
export const Header = React.memo(HeaderComponent);
