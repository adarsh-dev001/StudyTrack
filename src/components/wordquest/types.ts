
import type { LucideIcon } from 'lucide-react';

// Updated GameMode to include 'expert' instead of 'rapidFire'
export type GameMode = 'junior' | 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface GameModeDetails {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText?: string; 
  colorClass?: string;  
  iconColorClass?: string; 
}

export interface WordData {
  id: string;
  word: string; 
  clueType: 'image' | 'definition' | 'fill-in-the-blank' | 'meaning'; 
  clue: string; 
  options?: string[]; 
  correctAnswer: string; 
  hint?: string; 
  matchWord?: string; 
}
    