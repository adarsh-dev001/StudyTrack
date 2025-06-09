
import type { LucideIcon } from 'lucide-react';

// Updated GameMode to only include Basic, Intermediate, and Advanced
export type GameMode = 'basic' | 'intermediate' | 'advanced';

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
    
