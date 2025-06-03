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
    imageSrc: 'https://s39613.pcdn.co/wp-content/uploads/2024/05/students-learning-online-in-computer-app-with-ai-helper-bot-education-assistant-e-learning.jpg_s1024x1024wisk20c9ZjFzirmnCqf0_OYhZR6a0vd1flukm2-Jv5-MNaODbY.jpg',
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
