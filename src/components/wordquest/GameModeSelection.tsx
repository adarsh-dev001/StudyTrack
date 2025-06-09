
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Image as ImageIcon, ListChecks, Library, Flame, Skull } from 'lucide-react'; // Updated icons
import type { GameMode, GameModeDetails } from './types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Updated game mode details to match the new design
const gameModesDetails: Record<GameMode, GameModeDetails> = {
  junior: {
    title: 'Junior',
    description: 'Simple words with picture clues',
    icon: ImageIcon,
    colorClass: 'border-blue-500/30 bg-blue-500/5 hover:shadow-blue-500/10',
    iconColorClass: 'text-blue-500',
  },
  basic: {
    title: 'Basic',
    description: 'Everyday words with multiple choice answers',
    icon: ListChecks, // Changed from Type
    colorClass: 'border-green-500/30 bg-green-500/5 hover:shadow-green-500/10',
    iconColorClass: 'text-green-500',
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Test your typing and spelling skills with interesting words',
    icon: Library, // Changed from Brain
    colorClass: 'border-teal-500/30 bg-teal-500/5 hover:shadow-teal-500/10', // Greenish-blue accent
    iconColorClass: 'text-teal-500',
  },
  advanced: {
    title: 'Advanced',
    description: 'Challenging words to level up your vocabulary',
    icon: Flame, // Changed from Zap
    colorClass: 'border-orange-500/30 bg-orange-500/5 hover:shadow-orange-500/10',
    iconColorClass: 'text-orange-500',
  },
  expert: { // Changed from rapidFire to expert
    title: 'Expert',
    description: 'Rare and sophisticated words for vocabulary masters',
    icon: Skull, // Changed from Clock
    colorClass: 'border-purple-500/30 bg-purple-500/5 hover:shadow-purple-500/10',
    iconColorClass: 'text-purple-500',
  },
};

interface GameModeSelectionProps {
  selectedMode: GameMode | null;
  onModeSelect: (mode: GameMode) => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function GameModeSelection({ selectedMode, onModeSelect }: GameModeSelectionProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 px-4 md:px-6" // Added padding
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
    >
      {(Object.keys(gameModesDetails) as GameMode[]).map((modeKey) => {
        const modeDetail = gameModesDetails[modeKey];
        const IconComponent = modeDetail.icon;
        const isSelected = selectedMode === modeKey;
        return (
          <motion.div 
            key={modeKey} 
            variants={cardVariants}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card
              onClick={() => onModeSelect(modeKey)}
              className={cn(
                "shadow-md hover:shadow-lg transition-all duration-200 ease-out cursor-pointer flex flex-col h-full text-center items-center justify-center p-4 sm:p-6 min-h-[160px] sm:min-h-[180px]",
                modeDetail.colorClass,
                isSelected ? 'ring-2 ring-offset-2 ring-teal-400 shadow-xl' : 'ring-1 ring-border' // Highlight for selected
              )}
            >
              <IconComponent className={cn("h-7 w-7 sm:h-8 sm:w-8 mb-2 sm:mb-3", modeDetail.iconColorClass)} />
              <CardTitle className="text-md sm:text-lg font-semibold text-foreground">{modeDetail.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-tight">
                {modeDetail.description}
              </CardDescription>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

    