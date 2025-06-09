
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Library, Flame } from 'lucide-react'; // Adjusted icons
import type { GameMode, GameModeDetails } from './types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Updated game mode details to only include Basic, Intermediate, Advanced
const gameModesDetails: Record<GameMode, GameModeDetails> = {
  basic: {
    title: 'Basic',
    description: 'Everyday words with multiple choice answers',
    icon: ListChecks,
    colorClass: 'border-green-500/30 bg-green-500/5 hover:shadow-green-500/10',
    iconColorClass: 'text-green-500',
  },
  intermediate: {
    title: 'Intermediate',
    description: 'Test your typing and spelling skills with interesting words',
    icon: Library,
    colorClass: 'border-teal-500/30 bg-teal-500/5 hover:shadow-teal-500/10',
    iconColorClass: 'text-teal-500',
  },
  advanced: {
    title: 'Advanced',
    description: 'Challenging words to level up your vocabulary',
    icon: Flame,
    colorClass: 'border-orange-500/30 bg-orange-500/5 hover:shadow-orange-500/10',
    iconColorClass: 'text-orange-500',
  },
};

interface GameModeSelectionProps {
  selectedMode: GameMode | null;
  onModeSelect: (mode: GameMode) => void;
}

const cardVariantsContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 }
  }
};

const cardVariantItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

const cardHoverTapProps = {
  whileHover: { y: -5, scale: 1.03, boxShadow: "0px 8px 20px rgba(0,0,0,0.08)" },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 300, damping: 15 }
};


export default function GameModeSelection({ selectedMode, onModeSelect }: GameModeSelectionProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 px-4 md:px-6" // Added padding
      variants={cardVariantsContainer}
      initial="hidden"
      animate="visible"
    >
      {(Object.keys(gameModesDetails) as GameMode[]).map((modeKey) => {
        const modeDetail = gameModesDetails[modeKey];
        const IconComponent = modeDetail.icon;
        const isSelected = selectedMode === modeKey;
        return (
          <motion.div
            key={modeKey}
            variants={cardVariantItem}
            {...cardHoverTapProps}
            onClick={() => onModeSelect(modeKey)}
            className={cn(
              "cursor-pointer rounded-xl overflow-hidden", // Apply rounded here for motion.div to clip shadow
              isSelected ? 'ring-2 ring-offset-2 ring-teal-400 shadow-xl' : 'ring-1 ring-transparent' // Ring on motion.div for better effect
            )}
          >
            <Card
              className={cn(
                "shadow-md transition-all duration-200 ease-out flex flex-col h-full text-center items-center justify-center p-4 sm:p-6 min-h-[160px] sm:min-h-[180px]",
                modeDetail.colorClass,
                isSelected ? 'border-transparent' : 'border-border' // Remove card border if selected for cleaner ring look
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
