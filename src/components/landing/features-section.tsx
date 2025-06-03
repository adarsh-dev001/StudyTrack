
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  BrainCircuit, Gamepad2, TrendingUp, HelpCircle, Lock, Sparkles, ListChecks, Award, BarChart, Settings2, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const featureShowcaseData = [
  {
    id: 'ai-tools',
    icon: BrainCircuit,
    title: 'AI Tools That Think Like a Mentor',
    description: 'Leverage cutting-edge AI to supercharge your study process. Get smart syllabus suggestions, instant material summaries, and generate custom quizzes tailored to your needs.',
    details: [
      'AI Syllabus Suggester: Personalized plans for NEET, JEE, UPSC.',
      'Study Material Summarizer: Grasp key concepts quickly.',
      'Quiz Generator: Test yourself with difficulty & exam filters.',
    ],
    imageSrc: 'https://placehold.co/500x350/7DD3FC/000000.png?text=AI+Powered+Tools',
    imageAlt: 'AI Tools illustration',
    dataAiHint: 'artificial intelligence study',
    ctaText: 'Try AI Tools Now',
    ctaLink: '/ai-tools',
    align: 'left',
  },
  {
    id: 'gamification',
    icon: Gamepad2,
    title: 'Gamified Study Experience',
    description: 'Turn study into an adventure! Earn XP for completing Pomodoros, acing quizzes, and consistent planning. Unlock prestigious badges and climb the leaderboards.',
    details: [
      'Earn XP: For Pomodoros, quizzes, and planning tasks.',
      'Unlock Badges: Show off achievements like "Planner Pro" & "Quiz Master".',
      'Leaderboards: Compete with peers and stay motivated.',
    ],
    imageSrc: 'https://placehold.co/500x350/F97316/FFFFFF.png?text=Gamified+Learning',
    imageAlt: 'Gamification in learning illustration',
    dataAiHint: 'gamification education achievement',
    ctaText: 'See Gamification Features',
    ctaLink: '/streaks', // Link to streaks or a future gamification page
    align: 'right',
  },
  {
    id: 'progress-wall',
    icon: TrendingUp,
    title: 'Your Personal Progress Wall',
    description: 'Visualize your dedication and growth. Track your study streaks with a heatmap, monitor Pomodoro sessions, and get insightful weekly reviews.',
    details: [
      'Heatmap Streak Tracker: Like GitHub, but for your studies!',
      'Pomodoro Counter: See your focused hours accumulate.',
      'Weekly Review Panel: Reflect and plan for continuous improvement.',
    ],
    imageSrc: 'https://placehold.co/500x350/4ADE80/FFFFFF.png?text=Progress+Tracking',
    imageAlt: 'Progress tracking illustration',
    dataAiHint: 'progress chart analytics',
    ctaText: 'Visualize Your Growth',
    ctaLink: '/dashboard', // Or future analytics page
    align: 'left',
  },
  {
    id: 'quiz-generator',
    icon: HelpCircle,
    title: 'SmartQuiz AI (Enhanced & Coming Soon)',
    description: 'An advanced quiz generator is on its way! Features topic selection, difficulty/exam filters (NEET, UPSC, JEE), real-time scoring, detailed explanations, and leaderboard integration.',
    details: [
      'Topic-based quizzes with customizable difficulty.',
      'Exam-specific modes: NEET, UPSC, JEE & more.',
      'Instant scoring, explanations, and progress tracking.',
    ],
    imageSrc: 'https://placehold.co/500x350/A855F7/FFFFFF.png?text=Quiz+Generator+V2',
    imageAlt: 'Advanced Quiz Generator illustration',
    dataAiHint: 'quiz test assessment',
    ctaText: 'Learn More (Coming Soon)',
    ctaLink: '#',
    isComingSoon: true,
    align: 'right',
  },
  {
    id: 'productivity-ai',
    icon: Lock, // Or Settings2
    title: 'Smart Productivity AI (Unlockable)',
    description: 'Unlock your personal AI productivity coach after 7 days of consistent use! This premium tool analyzes your study time, common distractions, and focus trends to provide personalized weekly feedback.',
    details: [
      'Unlockable Feature: Rewards consistent platform use.',
      'In-depth Analysis: Study patterns, distractions, focus levels.',
      'Personalized Feedback: Actionable insights for optimization.',
    ],
    imageSrc: 'https://placehold.co/500x350/FACC15/000000.png?text=Locked+AI+Feature',
    imageAlt: 'Locked AI Productivity Feature illustration',
    dataAiHint: 'ai coach productivity',
    ctaText: 'Unlock with Consistency',
    ctaLink: '/ai-tools/productivity-analyzer',
    isLocked: true,
    align: 'left',
  },
];

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, delay: 0.2, ease: "easeOut" } },
};

const textVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.3, ease: "easeOut" } },
};
const textVariantsRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, delay: 0.3, ease: "easeOut" } },
};


export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-16 md:py-24 lg:py-32 bg-secondary/20">
      <div className="container mx-auto px-4 md:px-6 space-y-16 md:space-y-24">
        {featureShowcaseData.map((feature, index) => (
          <motion.div
            key={feature.id}
            className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            <motion.div 
              className={`relative aspect-video w-full max-w-lg mx-auto rounded-xl shadow-2xl overflow-hidden group ${feature.align === 'right' ? 'lg:order-last' : ''}`}
              variants={imageVariants}
            >
              <Image
                src={feature.imageSrc}
                alt={feature.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 500px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                data-ai-hint={feature.dataAiHint}
              />
              {feature.isLocked && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Lock className="h-16 w-16 text-white/70" />
                </div>
              )}
            </motion.div>

            <motion.div 
              className="space-y-4"
              variants={feature.align === 'right' ? textVariantsRight : textVariants}
            >
              <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium flex items-center gap-2">
                <feature.icon className="h-5 w-5" />
                {feature.title}
                {feature.isComingSoon && <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full">Coming Soon</span>}
                 {feature.isLocked && (
                    <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="text-xs bg-gray-400 text-gray-900 px-1.5 py-0.5 rounded-full cursor-help">Locked</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Unlock by using StudyTrack consistently for 7 days!</p>
                        </TooltipContent>
                    </Tooltip>
                    </TooltipProvider>
                 )}
              </div>
              <p className="text-muted-foreground md:text-lg/relaxed">{feature.description}</p>
              <ul className="space-y-1.5 text-muted-foreground">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-start">
                    <Sparkles className="h-4 w-4 text-accent mr-2 mt-1 shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              <Button 
                asChild 
                size="lg" 
                className="mt-4 text-base"
                variant={feature.isComingSoon || feature.isLocked ? "secondary" : "default"}
                disabled={feature.isComingSoon}
              >
                <Link href={feature.ctaLink}>
                  {feature.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
