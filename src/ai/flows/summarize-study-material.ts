// Summarizes study material to grasp key concepts quickly.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  material: z.string().describe('The study material to summarize.'),
  topic: z.string().describe('The topic of the study material.'),
});

export type SummarizeStudyMaterialInput = z.infer<typeof SummarizeStudyMaterialInputSchema>;

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material.'),
});

export type SummarizeStudyMaterialOutput = z.infer<typeof SummarizeStudyMaterialOutputSchema>;

export async function summarizeStudyMaterial(
  input: SummarizeStudyMaterialInput
): Promise<SummarizeStudyMaterialOutput> {
  return summarizeStudyMaterialFlow(input);
}

const summarizeStudyMaterialPrompt = ai.definePrompt({
  name: 'summarizeStudyMaterialPrompt',
  input: {schema: SummarizeStudyMaterialInputSchema},
  output: {schema: SummarizeStudyMaterialOutputSchema},
  prompt: `Summarize the following study material about {{topic}}:\n\n{{material}}\n\nProvide a concise summary that captures the key concepts.`,
});

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: SummarizeStudyMaterialInputSchema,
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async input => {
    const {output} = await summarizeStudyMaterialPrompt(input);
    return output!;
  }
);
