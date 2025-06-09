
// No 'use server'; directive here as it's a schema definition file
import { z } from 'zod';

export const GenerateWordQuestChallengeInputSchema = z.object({
  gameMode: z.enum(['basic', 'intermediate', 'advanced']).describe("The selected game mode, which dictates difficulty and format."),
  // topic: z.string().optional().describe("Optional topic to theme the words (e.g., 'Science', 'History'). Default to general vocabulary."),
  // difficultyLevel: z.enum(['easy', 'medium', 'hard']).optional().describe("Overall difficulty. AI should adjust word choice and clue complexity. Can be inferred from gameMode."),
  previousWords: z.array(z.string()).optional().describe("An array of words already used in the current session to avoid repetition by the AI."),
});
export type GenerateWordQuestChallengeInput = z.infer<typeof GenerateWordQuestChallengeInputSchema>;

export const WordQuestChallengeOutputSchema = z.object({
  word: z.string().min(1).describe("The target word for the challenge. Should be a single word."),
  clue: z.string().min(10).describe("The definition or clue for the word. For fill-in-the-blank, this should be the sentence with a blank (e.g., '____ means very happy')."),
  clueType: z.enum(['definition', 'fill-in-the-blank']).describe("Type of clue provided, either a direct definition or a sentence where the word fits."),
  options: z.array(z.string().min(1))
    .min(3).max(4)
    .optional()
    .describe("An array of 3-4 plausible answer options for multiple-choice questions, including the correct word. Required and only relevant for 'basic' game mode."),
  hint: z.string().optional().describe("A short, helpful hint for the word. Primarily for 'intermediate' and 'advanced' modes. Should not reveal the word directly."),
});
export type WordQuestChallengeOutput = z.infer<typeof WordQuestChallengeOutputSchema>;
