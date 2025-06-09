
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, BrainCircuit, ListChecks, Flame, HelpCircle, FileText, Puzzle } from 'lucide-react'; // Updated imports
import type { LucideIcon } from 'lucide-react';

interface FeatureShowcaseItem {
  icon: LucideIcon;
  title: string;
  description: string;
  learnMoreLink?: string;
  iconColorClass: string;
  bgColorClass: string;
}

const features: FeatureShowcaseItem[] = [
  {
    icon: BrainCircuit,
    title: 'AI Syllabus Planner',
    description: 'Get personalized study roadmaps tailored to your exams, saving you hours of planning.',
    learnMoreLink: '/ai-tools/syllabus-suggester',
    iconColorClass: 'text-sky-500',
    bgColorClass: 'bg-sky-500/5 hover:bg-sky-500/10',
  },
  {
    icon: ListChecks,
    title: 'Interactive Task Management',
    description: 'Organize your studies with customizable tasks, deadlines, and color-coded priorities.',
    learnMoreLink: '/tasks',
    iconColorClass: 'text-green-500',
    bgColorClass: 'bg-green-500/5 hover:bg-green-500/10',
  },
  {
    icon: FileText, // Changed from Timer
    title: 'AI Notes Generator', // Changed from Pomodoro Timer
    description: 'Transform text or PDFs into structured notes, summaries, and quizzes with AI.',
    learnMoreLink: '/ai-tools/material-summarizer',
    iconColorClass: 'text-amber-500',
    bgColorClass: 'bg-amber-500/5 hover:bg-amber-500/10',
  },
  {
    icon: HelpCircle, // Changed from BarChart3
    title: 'SmartQuiz AI', // Changed from Productivity Stats
    description: 'Generate custom quizzes on any topic, tailored to exam type and difficulty level.',
    learnMoreLink: '/ai-tools/smart-quiz',
    iconColorClass: 'text-teal-500',
    bgColorClass: 'bg-teal-500/5 hover:bg-teal-500/10',
  },
  {
    icon: Flame,
    title: 'Daily Study Streaks',
    description: 'Build consistency and stay motivated by tracking your daily study streaks and earning rewards.',
    learnMoreLink: '/streaks',
    iconColorClass: 'text-red-500',
    bgColorClass: 'bg-red-500/5 hover:bg-red-500/10',
  },
  {
    icon: Puzzle, // Changed from HelpCircle
    title: 'WordQuest AI', // Changed from AI Doubt Solver
    description: 'Sharpen your vocabulary with engaging word challenges and games powered by AI.',
    learnMoreLink: '/wordquest',
    iconColorClass: 'text-indigo-500',
    bgColorClass: 'bg-indigo-500/5 hover:bg-indigo-500/10',
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const cardContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

function FeatureShowcaseSectionComponent() {
  return (
    <motion.section
      className="w-full py-16 md:py-24 lg:py-28 bg-gradient-to-b from-background via-secondary/10 to-background"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="font-headline text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">
            Unlock Your Full Potential with StudyTrack AI
          </h2>
          <p className="mt-3 md:mt-4 max-w-2xl mx-auto text-muted-foreground text-md md:text-lg/relaxed">
            Explore the core features that make StudyTrack your ultimate study partner for competitive exams.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={cardContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={cardItemVariants}
                whileHover={{ y: -6, boxShadow: "0px 10px 25px rgba(0,0,0,0.12), 0px 5px 10px rgba(0,0,0,0.08)" }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <Card className={`flex flex-col h-full rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ${feature.bgColorClass} border-transparent`}>
                  <CardHeader className="items-center text-center pt-6 pb-4">
                    <div className={`mb-3 inline-block rounded-full p-3 bg-gradient-to-br ${feature.iconColorClass.replace('text-', 'from-')}/30 ${feature.iconColorClass.replace('text-', 'to-')}/10`}>
                      <Icon className={`h-8 w-8 ${feature.iconColorClass}`} />
                    </div>
                    <CardTitle className="font-headline text-xl text-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center text-muted-foreground text-sm flex-grow px-5 pb-5">
                    <p>{feature.description}</p>
                  </CardContent>
                  {feature.learnMoreLink && (
                    <div className="p-5 pt-0 text-center">
                      <Button variant="link" asChild className={`text-sm ${feature.iconColorClass.replace('text-','text-')}`}>
                        <Link href={feature.learnMoreLink}>
                          Learn More <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
}
export default React.memo(FeatureShowcaseSectionComponent);
