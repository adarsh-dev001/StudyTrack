
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Gamepad2, HelpCircle, Flame, BarChart3, Edit3, Users, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface FeatureItem {
  icon: LucideIcon;
  name: string;
}

const featureItems: FeatureItem[] = [
  { icon: BrainCircuit, name: 'AI Study Tools' },
  { icon: Gamepad2, name: 'Gamified XP & Badges' },
  { icon: HelpCircle, name: 'Quiz Generator' },
  { icon: Flame, name: 'Streak Tracker' },
  { icon: BarChart3, name: 'Leaderboards' },
  { icon: Edit3, name: 'Study Journal' },
  { icon: Users, name: 'Weekly Review AI' },
  { icon: Target, name: 'Multi-Exam Support' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

function KeyFeaturesSummaryComponent() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Everything You Need, All in One Place
          </h2>
          <p className="mt-3 md:mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg/relaxed">
            StudyTrack combines powerful AI, engaging gamification, and robust planning tools to support your journey for exams like NEET, UPSC, JEE, SSC, and more.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {featureItems.map((item) => (
            <motion.div
              key={item.name}
              className="flex flex-col items-center p-4 md:p-6 bg-card rounded-xl shadow-lg hover:shadow-primary/20 transition-shadow duration-300 transform hover:-translate-y-1"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <div className="p-3 md:p-4 bg-primary/10 rounded-full mb-3 md:mb-4">
                <item.icon className="h-7 w-7 md:h-8 md:w-8 text-primary" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-center text-card-foreground">{item.name}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default React.memo(KeyFeaturesSummaryComponent);
