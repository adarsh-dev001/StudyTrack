
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Type, Zap, Brain, Clock } from 'lucide-react';
import type { GameMode, GameModeDetails } from './types'; // Ensure types.ts is created
import { motion } from 'framer-motion';

const gameModesDetails: Record<GameMode, GameModeDetails> = {
  junior: {
    title: 'Junior Journey',
    description: 'Simple words with picture clues. Perfect for young beginners!',
    icon: BookOpen, // Placeholder, consider an icon representing pictures or simplicity
    buttonText: 'Start Junior',
    colorClass: 'border-blue-500/50 bg-blue-500/5 hover:shadow-blue-500/20',
    iconColorClass: 'text-blue-500',
  },
  basic: {
    title: 'Basic Builder',
    description: 'Everyday words with multiple-choice options. Build your foundation.',
    icon: Type, // Placeholder, consider an icon representing choices
    buttonText: 'Play Basic',
    colorClass: 'border-green-500/50 bg-green-500/5 hover:shadow-green-500/20',
    iconColorClass: 'text-green-500',
  },
  intermediate: {
    title: 'Intermediate Challenge',
    description: 'Fill-in-the-blanks with hints (e.g., "Starts with P"). Step up your game!',
    icon: Brain, // Placeholder, consider an icon for thinking or puzzles
    buttonText: 'Take Intermediate',
    colorClass: 'border-yellow-500/50 bg-yellow-500/5 hover:shadow-yellow-500/20',
    iconColorClass: 'text-yellow-500',
  },
  advanced: {
    title: 'Advanced Arena',
    description: 'Difficult words via descriptive clues, under time pressure. Test your limits!',
    icon: Zap,
    buttonText: 'Enter Advanced',
    colorClass: 'border-red-500/50 bg-red-500/5 hover:shadow-red-500/20',
    iconColorClass: 'text-red-500',
  },
  rapidFire: {
    title: 'Rapid Fire Round',
    description: 'Quickly match meanings with words in a fast-paced, time-bound setting.',
    icon: Clock,
    buttonText: 'Go Rapid Fire',
    colorClass: 'border-purple-500/50 bg-purple-500/5 hover:shadow-purple-500/20',
    iconColorClass: 'text-purple-500',
  },
};

interface GameModeSelectionProps {
  onModeSelect: (mode: GameMode) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function GameModeSelection({ onModeSelect }: GameModeSelectionProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {(Object.keys(gameModesDetails) as GameMode[]).map((modeKey) => {
        const modeDetail = gameModesDetails[modeKey];
        const IconComponent = modeDetail.icon;
        return (
          <motion.div key={modeKey} variants={cardVariants}>
            <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 ease-out transform hover:-translate-y-1 flex flex-col h-full ${modeDetail.colorClass}`}>
              <CardHeader className="p-4 sm:p-5">
                <div className="flex items-center gap-3 mb-1 sm:mb-1.5">
                  <div className={`p-2 rounded-md ${modeDetail.colorClass?.replace('border-', 'bg-').replace('/50', '/10').replace('/5', '/10')}`}>
                    <IconComponent className={`h-6 w-6 sm:h-7 sm:w-7 ${modeDetail.iconColorClass}`} />
                  </div>
                  <CardTitle className="text-lg sm:text-xl font-semibold text-foreground">{modeDetail.title}</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed min-h-[40px] sm:min-h-[48px]">
                  {modeDetail.description}
                </CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto p-4 sm:p-5">
                <Button
                  onClick={() => onModeSelect(modeKey)}
                  className="w-full text-sm sm:text-base"
                  variant="default" // Or dynamically based on modeDetail.colorClass
                >
                  {modeDetail.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

    