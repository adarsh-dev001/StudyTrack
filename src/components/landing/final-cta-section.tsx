'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Rocket, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "circOut" } },
};

const ctaList = [
  "Personalized AI-Generated Syllabus",
  "Engaging Gamified Motivation System",
  "Trackable Progress for Real Results",
  "Smart AI Tools for Efficient Study",
];

function FinalCtaSectionComponent() {
  return (
    <section id="final-cta" className="w-full py-16 md:py-24 lg:py-32 bg-gradient-to-b from-background via-sky-500/5 to-sky-500/10 dark:via-sky-800/5 dark:to-sky-800/10">
      <motion.div 
        className="container mx-auto px-4 md:px-6 text-center"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          className="inline-block rounded-full bg-primary/10 p-3 md:p-4 mb-4 md:mb-6"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <Rocket className="h-8 w-8 md:h-10 md:w-10 text-primary" />
        </motion.div>
        <motion.h2 
          className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-foreground"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Ready to Level Up Your Studies?
        </motion.h2>
        <motion.p 
          className="mt-4 md:mt-6 mx-auto max-w-xl md:max-w-2xl text-muted-foreground text-md md:text-lg lg:text-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Join StudyTrack today and transform your exam preparation with smart tools, motivating features, and a clear path to success.
        </motion.p>
        
        <motion.ul 
          className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 md:gap-y-4 max-w-lg mx-auto text-left"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.5 }}
        >
          {ctaList.map((item, index) => (
            <motion.li key={index} className="flex items-center text-muted-foreground text-sm md:text-base" variants={itemVariants}>
              <CheckCircle className="h-5 w-5 text-green-500 mr-2.5 shrink-0" />
              {item}
            </motion.li>
          ))}
        </motion.ul>

        <motion.div 
          className="mt-10 md:mt-12 flex flex-col sm:flex-row justify-center items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <Button size="xl" asChild className="w-full sm:w-auto text-base md:text-lg py-3.5 px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/40 transition-all duration-300">
            <Link href="/signup">
              Start Free & Ace Your Exams
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="xl" asChild className="w-full sm:w-auto text-base md:text-lg py-3.5 px-8 hover:bg-accent/10 hover:border-accent transition-all duration-300">
            <Link href="#features">Explore All Features</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default React.memo(FinalCtaSectionComponent);
