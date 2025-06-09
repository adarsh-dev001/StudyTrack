
// src/lib/wordquest-db-types.ts
export type WordDifficulty = 'basic' | 'intermediate' | 'advanced';

export interface VocabularyItem {
  id: string; // Firestore document ID (can be same as word in lowercase)
  word: string; // The actual word, e.g., "SERENDIPITY"
  difficulty: WordDifficulty;
  definition: string;
  exampleSentence?: string;
  category?: string; // e.g., "Science", "Literature", "General"
  partsOfSpeech?: string; // e.g., "noun", "verb"
  // Optional: for basic mode, could pre-define distractors
  distractors?: string[]; 
  // Optional: pre-defined hint
  hint?: string;
}
