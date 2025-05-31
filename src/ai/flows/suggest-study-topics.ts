'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting study topics based on the exam the user is preparing for.
 *
 * - suggestStudyTopics - A function that takes the exam type and returns a list of suggested study topics.
 * - SuggestStudyTopicsInput - The input type for the suggestStudyTopics function.
 * - SuggestStudyTopicsOutput - The return type for the suggestStudyTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStudyTopicsInputSchema = z.object({
  examType: z
    .string()
    .describe('The type of exam the user is preparing for (e.g., NEET, UPSC, JEE).'),
});
export type SuggestStudyTopicsInput = z.infer<typeof SuggestStudyTopicsInputSchema>;

const SuggestStudyTopicsOutputSchema = z.object({
  topics: z
    .array(z.string())
    .describe('An array of suggested study topics based on the exam type.'),
});
export type SuggestStudyTopicsOutput = z.infer<typeof SuggestStudyTopicsOutputSchema>;

export async function suggestStudyTopics(input: SuggestStudyTopicsInput): Promise<SuggestStudyTopicsOutput> {
  return suggestStudyTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStudyTopicsPrompt',
  input: {schema: SuggestStudyTopicsInputSchema},
  output: {schema: SuggestStudyTopicsOutputSchema},
  prompt: `You are an expert study planner. Based on the exam type the user is preparing for, suggest a list of relevant study topics.

Exam Type: {{{examType}}}

Topics:`,
});

const suggestStudyTopicsFlow = ai.defineFlow(
  {
    name: 'suggestStudyTopicsFlow',
    inputSchema: SuggestStudyTopicsInputSchema,
    outputSchema: SuggestStudyTopicsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
