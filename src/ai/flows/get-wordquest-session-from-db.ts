
'use server';
/**
 * @fileOverview AI flow to fetch WordQuest challenges, simulating a database interaction.
 *
 * - getWordQuestSessionFromDb - Fetches a session of challenges.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateWordQuestSessionInputSchema,
  WordQuestSessionOutputSchema,
  SingleWordQuestChallengeSchema,
  type GenerateWordQuestSessionInput,
  type WordQuestSessionOutput,
  type SingleWordQuestChallenge,
} from '@/ai/schemas/wordquest-ai-schemas';
import type { VocabularyItem, WordDifficulty } from '@/lib/wordquest-db-types';

// --- SIMULATED DATABASE ---
// In a real scenario, this data would come from Firestore.
// User should replace this with actual Firestore queries.
const SIMULATED_VOCABULARY_DB: VocabularyItem[] = [
  { id: 'happy', word: 'Happy', difficulty: 'basic', definition: 'Feeling or showing pleasure or contentment.', exampleSentence: 'She was happy to see him.', partsOfSpeech: 'adjective', distractors: ['Sad', 'Angry', 'Tired'] },
  { id: 'brave', word: 'Brave', difficulty: 'basic', definition: 'Ready to face and endure danger or pain; showing courage.', exampleSentence: 'The brave knight faced the dragon.', partsOfSpeech: 'adjective', distractors: ['Scared', 'Shy', 'Weak'] },
  { id: 'explore', word: 'Explore', difficulty: 'basic', definition: 'Travel through (an unfamiliar area) in order to learn about it.', exampleSentence: 'They went to explore the jungle.', partsOfSpeech: 'verb', distractors: ['Stay', 'Ignore', 'Sleep'] },
  { id: 'enormous', word: 'Enormous', difficulty: 'intermediate', definition: 'Very large in size, quantity, or extent.', category: 'Size', partsOfSpeech: 'adjective', hint: 'Means very big.' },
  { id: 'serendipity', word: 'Serendipity', difficulty: 'intermediate', definition: 'The occurrence of events by chance in a happy or beneficial way.', category: 'General', partsOfSpeech: 'noun', hint: 'A fortunate accident.' },
  { id: 'ubiquitous', word: 'Ubiquitous', difficulty: 'advanced', definition: 'Present, appearing, or found everywhere.', category: 'General', partsOfSpeech: 'adjective', hint: 'Seems to be everywhere at once.' },
  { id: 'ephemeral', word: 'Ephemeral', difficulty: 'advanced', definition: 'Lasting for a very short time.', category: 'Time', partsOfSpeech: 'adjective', hint: 'Doesn\'t last long.' },
  { id: 'quick', word: 'Quick', difficulty: 'basic', definition: 'Moving fast or doing something in a short time.', partsOfSpeech: 'adjective', distractors: ['Slow', 'Lazy', 'Still'] },
  { id: 'journey', word: 'Journey', difficulty: 'intermediate', definition: 'An act of traveling from one place to another.', hint: 'Often a long trip.' },
  { id: 'verbose', word: 'Verbose', difficulty: 'advanced', definition: 'Using or expressed in more words than are needed.', hint: 'Talks too much.' },
];
// --- END OF SIMULATED DATABASE ---

export async function getWordQuestSessionFromDb(input: GenerateWordQuestSessionInput): Promise<WordQuestSessionOutput> {
  return getWordQuestSessionFromDbFlow(input);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const getWordQuestSessionFromDbFlow = ai.defineFlow(
  {
    name: 'getWordQuestSessionFromDbFlow',
    inputSchema: GenerateWordQuestSessionInputSchema,
    outputSchema: WordQuestSessionOutputSchema,
  },
  async (input): Promise<WordQuestSessionOutput> => {
    const { gameMode, numChallenges = 3, previousWords = [] } = input;
    const difficulty = gameMode as WordDifficulty; // 'basic', 'intermediate', 'advanced'

    // Simulate fetching from Firestore based on difficulty
    let potentialWords = SIMULATED_VOCABULARY_DB.filter(item => item.difficulty === difficulty);
    
    // Filter out previously used words in this flow's context (not across all user sessions yet)
    potentialWords = potentialWords.filter(item => !previousWords.includes(item.word));

    if (potentialWords.length === 0) {
      // Fallback if no words match criteria (e.g., all used or DB is empty for this difficulty)
      // For simulation, we'll just grab any words of the difficulty if previousWords filter emptied it.
      potentialWords = SIMULATED_VOCABULARY_DB.filter(item => item.difficulty === difficulty);
      if (potentialWords.length === 0) { // Still no words?
        throw new Error(`No vocabulary items found for difficulty: ${difficulty}. Please populate the database.`);
      }
    }
    
    const selectedDbItems = shuffleArray(potentialWords).slice(0, numChallenges);

    if (selectedDbItems.length === 0) {
        throw new Error(`Could not select any challenges for mode ${gameMode}. DB might be empty or all words used.`);
    }

    const challenges: SingleWordQuestChallenge[] = selectedDbItems.map(item => {
      const challenge: SingleWordQuestChallenge = {
        word: item.word,
        clue: item.definition, // Use definition as clue
        clueType: 'definition', // Default to definition for now
      };

      if (difficulty === 'basic') {
        let options = item.distractors ? [...item.distractors] : [];
        // Ensure correct word is in options
        if (!options.includes(item.word)) {
          options.push(item.word);
        }
        // Ensure 3-4 options. If not enough, pick random words from DB as distractors (simplified).
        let attempts = 0;
        while (options.length < 3 && attempts < 10) {
          const randomWordFromDb = SIMULATED_VOCABULARY_DB[Math.floor(Math.random() * SIMULATED_VOCABULARY_DB.length)].word;
          if (randomWordFromDb !== item.word && !options.includes(randomWordFromDb)) {
            options.push(randomWordFromDb);
          }
          attempts++;
        }
        options = shuffleArray(options.slice(0,4)); // Max 4 options
         if (options.length < 3) { // Still less than 3, critical issue or very small DB
            // Add placeholders to ensure UI doesn't break
            while(options.length < 3) options.push(`Placeholder${options.length+1}`);
        }
        challenge.options = options;
      } else { // intermediate or advanced
        challenge.hint = item.hint || `Hint: Related to ${item.category || 'general knowledge'}.`;
        if (item.exampleSentence && Math.random() < 0.5) { // Randomly choose to make it fill-in-the-blank
            challenge.clue = item.exampleSentence.replace(new RegExp(item.word, 'i'), '_______');
            challenge.clueType = 'fill-in-the-blank';
        }
      }
      return challenge;
    });
    
    if (challenges.length === 0) {
        throw new Error('Failed to generate any valid challenges from the simulated DB.');
    }

    return { challenges };
  }
);
