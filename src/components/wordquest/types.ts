
import type { LucideIcon } from 'lucide-react';

export type GameMode = 'junior' | 'basic' | 'intermediate' | 'advanced' | 'rapidFire';

export interface GameModeDetails {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText?: string; // Optional, can be derived or set
  colorClass?: string;  // Optional, for styling mode cards
  iconColorClass?: string; // Optional, for icon styling
}

export interface WordData {
  id: string;
  word: string; // The target word
  clueType: 'image' | 'definition' | 'fill-in-the-blank' | 'meaning'; // Type of clue
  clue: string; // URL for image, text for definition/fill-in-the-blank, or meaning for rapid fire
  options?: string[]; // For MCQ modes like 'basic' or 'rapidFire' (options for the meaning)
  correctAnswer: string; // The correct word or the correct option from 'options'
  hint?: string; // Optional hint, e.g., "Starts with P"
  matchWord?: string; // For rapidFire, the word to match with the 'clue' (which is a meaning)
}
    