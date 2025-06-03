
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Brain, Gamepad, TrendingUp, HelpCircle, Lock, Sparkles, ListChecks, Award, BarChart, Settings2, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge'; // Added import for Badge

const featureShowcaseData = [
  {
    id: 'ai-tools',
    icon: Brain,
    title: 'AI Tools That Think Like a Mentor',
    description: 'Leverage cutting-edge AI to supercharge your study process. Get smart syllabus suggestions, instant material summaries, and generate custom quizzes tailored to your needs.',
    details: [
      'AI Syllabus Suggester: Personalized plans for NEET, JEE, UPSC.',
      'Study Material Summarizer: Grasp key concepts quickly.',
      'Quiz Generator: Test yourself with difficulty & exam filters.',
    ],
    imageSrc: 'https://s39613.pcdn.co/wp-content/uploads/2024/05/students-learning-online-in-computer-app-with-ai-helper-bot-education-assistant-e-learning.jpg_s1024x1024wisk20c9ZjFzirmnCqf0_OYhZR6a0vd1flukm2-Jv5-MNaODbY.jpg',
    imageAlt: 'AI Tools illustration',
    dataAiHint: 'artificial intelligence study',
    ctaText: 'Try AI Tools Now',
    ctaLink: '/ai-tools',
    align: 'left',
  },
  {
    id: 'gamification',
    icon: Gamepad,
    title: 'Gamified Study Experience',
    description: 'Turn study into an adventure! Earn XP for completing Pomodoros, acing quizzes, and consistent planning. Unlock prestigious badges and climb the leaderboards.',
    details: [
      'Earn XP: For Pomodoros, quizzes, and planning tasks.',
      'Unlock Badges: Show off achievements like "Planner Pro" & "Quiz Master".',
      'Leaderboards: Compete with peers and stay motivated.',
    ],
    imageSrc: 'https://cdn.prod.website-files.com/61f7efd44d01cc87c88dc6f3/67e7b567748e7e16e697ece0_ai%20for%20kids%202025.jpeg',
    imageAlt: 'Gamification in learning illustration',
    dataAiHint: 'gamification education achievement',
    ctaText: 'See Gamification Features',
    ctaLink: '/streaks',
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
    imageSrc: 'https://res.cloudinary.com/monday-blogs/fl_lossy,f_auto,q_auto/wp-blog/2022/12/Customer-tracking.png',
    imageAlt: 'Progress tracking illustration',
    dataAiHint: 'progress chart analytics',
    ctaText: 'Visualize Your Growth',
    ctaLink: '/dashboard',
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
    imageSrc: 'https://img.freepik.com/premium-vector/vector-illustration-concept-testing-search-quiz-checklist-answers-success-results_675567-5412.jpg',
    imageAlt: 'Advanced Quiz Generator illustration',
    dataAiHint: 'quiz test assessment',
    ctaText: 'Learn More (Coming Soon)',
    ctaLink: '#',
    isComingSoon: true,
    align: 'right',
  },
  {
    id: 'productivity-ai',
    icon: Lock,
    title: 'Smart Productivity AI (Unlockable)',
    description: 'Unlock your personal AI productivity coach after 7 days of consistent use! This premium tool analyzes your study time, common distractions, and focus trends to provide personalized weekly feedback.',
    details: [
      'Unlockable Feature: Rewards consistent platform use.',
      'In-depth Analysis: Study patterns, distractions, focus levels.',
      'Personalized Feedback: Actionable insights for optimization.',
    ],
    imageSrc: 'https://i0.wp.com/floify.com/wp-content/uploads/2023/05/Productivity-Tools-Every-Business-Should-Use.jpg',
    imageAlt: 'Locked AI Productivity Feature illustration',
    dataAiHint: 'ai coach productivity',
    ctaText: 'Unlock with Consistency',
    ctaLink: '/ai-tools/productivity-analyzer',
    isLocked: true,
    align: 'left',
  },
];

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.3, delayChildren: 0.2 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div 
          className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-xs sm:text-sm text-primary font-medium">
            Core Features
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl text-foreground">
            Unlock Your Full Potential
          </h2>
          <p className="max-w-[700px] text-muted-foreground text-sm sm:text-base md:text-lg/relaxed xl:text-xl/relaxed">
            StudyTrack offers a suite of powerful tools designed to make your exam preparation focused, efficient, and enjoyable.
          </p>
        </motion.div>

        <motion.div 
          className="space-y-12 md:space-y-20"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
        >
          {featureShowcaseData.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div 
                key={feature.id} 
                className={`grid gap-6 md:gap-10 lg:gap-16 items-center lg:grid-cols-2 ${feature.align === 'right' ? 'lg:grid-flow-col-dense' : ''}`}
                variants={itemVariants}
              >
                <div className={`relative w-full aspect-[16/10] rounded-xl overflow-hidden shadow-2xl group ${feature.align === 'right' ? 'lg:col-start-2' : ''}`}>
                  <Image
                    src={feature.imageSrc}
                    alt={feature.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
                    style={{ objectFit: 'cover' }}
                    className="rounded-xl transition-transform duration-500 ease-in-out group-hover:scale-105"
                    data-ai-hint={feature.dataAiHint}
                    priority={index < 2} 
                  />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-300"></div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="inline-block rounded-lg bg-primary/10 p-2.5 md:p-3 mb-2">
                    <IconComponent className="h-6 w-6 md:h-7 md:w-7 text-primary" />
                  </div>
                  <h3 className="font-headline text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base">{feature.description}</p>
                  <ul className="space-y-1.5 text-sm md:text-base text-muted-foreground">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-center">
                        <ListChecks className="mr-2 h-4 w-4 text-green-500 shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 md:pt-3">
                    <Button 
                      size="lg" 
                      asChild 
                      className="text-sm md:text-base shadow-md hover:shadow-lg transition-shadow"
                      variant={feature.isComingSoon || feature.isLocked ? "outline" : "default"}
                      disabled={feature.isComingSoon}
                    >
                      <Link href={feature.ctaLink}>
                        {feature.isComingSoon ? <Sparkles className="mr-2 h-4 w-4"/> : 
                         feature.isLocked ? <Lock className="mr-2 h-4 w-4"/> :
                         <ArrowRight className="mr-2 h-4 w-4"/>
                        }
                        {feature.ctaText}
                      </Link>
                    </Button>
                     {feature.isComingSoon && <Badge variant="secondary" className="ml-2">Coming Soon</Badge>}
                     {feature.isLocked && <Badge variant="outline" className="ml-2 text-primary border-primary">Unlockable</Badge>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

