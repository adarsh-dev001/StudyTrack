
// src/ai/schemas/wordquest-ai-schemas.ts
import { z } from 'zod';

// Input schema remains the same for requesting a session
export const GenerateWordQuestSessionInputSchema = z.object({
  gameMode: z.enum(['basic', 'intermediate', 'advanced']).describe("The selected game mode, which dictates difficulty and format."),
  previousWords: z.array(z.string()).optional().describe("An array of words already used in other sessions to avoid repetition if possible. Not strictly enforced by DB version yet."),
  numChallenges: z.number().int().min(1).max(5).optional().default(3).describe("Number of challenges to generate for the session."), // Max 5 for DB version initially
});
export type GenerateWordQuestSessionInput = z.infer<typeof GenerateWordQuestSessionInputSchema>;

// Single challenge structure remains the same for UI consumption
export const SingleWordQuestChallengeSchema = z.object({
  word: z.string().min(1).describe("The target word for the challenge. Should be a single word."),
  clue: z.string().min(1).describe("The definition or clue for the word."),
  clueType: z.enum(['definition', 'fill-in-the-blank']).describe("Type of clue provided."),
  options: z.array(z.string().min(1))
    .min(3).max(4)
    .optional()
    .describe("An array of 3-4 plausible answer options for 'basic' game mode, including the correct word."),
  hint: z.string().optional().describe("A short, helpful hint for 'intermediate' and 'advanced' modes."),
});
export type SingleWordQuestChallenge = z.infer<typeof SingleWordQuestChallengeSchema>;

// Output schema remains an array of challenges
export const WordQuestSessionOutputSchema = z.object({
  challenges: z.array(SingleWordQuestChallengeSchema).min(1).describe("An array of word challenges for the game session.")
});
export type WordQuestSessionOutput = z.infer<typeof WordQuestSessionOutputSchema>;
