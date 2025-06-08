
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function HeroSectionComponent() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-br from-primary/10 via-background to-background">
      <motion.div
        className="container mx-auto px-4 md:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center xl:gap-12">
          <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
            <motion.h1
              className="font-headline text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground"
              variants={itemVariants}
            >
              Study Smarter, Not Harder — <br className="hidden sm:inline"/>Powered by <span className="text-primary">AI & Gamification</span>
            </motion.h1>
            <motion.p
              className="max-w-[600px] text-muted-foreground text-md sm:text-lg md:text-xl xl:text-2xl mx-auto lg:mx-0"
              variants={itemVariants}
            >
              Ace your exams with XP rewards, AI tools, and a personalized planner — all in one platform.
            </motion.p>
            <motion.div
              className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
              variants={itemVariants}
            >
              <Button size="lg" asChild className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow text-base sm:text-lg py-3 px-6">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-base sm:text-lg py-3 px-6">
                <Link href="/quick-onboarding"> {/* Updated href here */}
                  Try AI Tools Now
                  <Zap className="ml-2 h-5 w-5 text-accent" />
                </Link>
              </Button>
            </motion.div>
          </div>
          <motion.div
            className="relative mx-auto w-full max-w-lg aspect-[4/3] overflow-hidden rounded-xl lg:max-w-xl mt-8 lg:mt-0"
            variants={itemVariants}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
          >
            {/* Placeholder for student leveling up animation */}
            <Image
              src="/images/Hero_iamge.png"
              alt="Student achieving goals with StudyTrack"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
              style={{ objectFit: 'cover' }}
              className="rounded-xl shadow-2xl"
              data-ai-hint="student success exam prep"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl"></div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default React.memo(HeroSectionComponent);
