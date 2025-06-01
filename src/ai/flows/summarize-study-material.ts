
'use server';
/**
 * @fileOverview A study material analysis AI agent.
 *
 * - summarizeStudyMaterial - A function that handles summarizing material, extracting key concepts, and generating MCQs.
 * - SummarizeStudyMaterialInput - The input type for the summarizeStudyMaterial function.
 * - SummarizeStudyMaterialOutput - The return type for the summarizeStudyMaterial function.
 * - MCQ - The type for a single Multiple Choice Question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeStudyMaterialInputSchema = z.object({
  material: z.string().describe('The study material to summarize.'),
  topic: z.string().describe('The topic of the study material.'),
});

export type SummarizeStudyMaterialInput = z.infer<typeof SummarizeStudyMaterialInputSchema>;

const MCQSchema = z.object({
  question: z.string().describe("The MCQ question text."),
  options: z.array(z.string()).min(3).max(5).describe("An array of 3-5 answer options."),
  correctAnswerIndex: z.number().int().min(0).describe("The 0-based index of the correct answer in the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct and/or why other options are incorrect.")
});
export type MCQ = z.infer<typeof MCQSchema>;

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material, approximately 100-200 words.'),
  keyConcepts: z.array(z.string()).min(3).max(7).describe("An array of 3-7 bullet points highlighting the key concepts from the material."),
  multipleChoiceQuestions: z.array(MCQSchema).min(3).max(5).describe("An array of 3-5 multiple-choice questions based on the material. Each MCQ should have a question, options, the index of the correct option, and an explanation.")
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
  prompt: `You are an expert academic assistant. A student needs help understanding some study material related to the topic: {{{topic}}}.

The material provided is:
---
{{{material}}}
---

Please perform the following tasks and structure your output as a JSON object conforming to the SummarizeStudyMaterialOutputSchema:
1.  **Summary**: Write a concise summary of the material, around 100-200 words.
2.  **Key Concepts**: List 5-7 key concepts from the material as bullet points.
3.  **Multiple Choice Questions**: Generate 3-5 multiple-choice questions (MCQs) based on the material. For each MCQ:
    *   Provide a clear question.
    *   Provide 4 distinct answer options.
    *   Clearly indicate the 0-based index of the correct answer within the options array.
    *   Provide a brief explanation for why the correct answer is right and, if relevant, why other choices might be incorrect.

Ensure the entire output is a single JSON object that strictly adheres to the SummarizeStudyMaterialOutputSchema.
Focus on extracting the most important information and creating relevant, challenging MCQs.
Example of an MCQ structure within the output:
{
  "question": "What is the powerhouse of the cell?",
  "options": ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
  "correctAnswerIndex": 1,
  "explanation": "Mitochondria are responsible for generating most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy."
}
`,
});

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: SummarizeStudyMaterialInputSchema,
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async input => {
    const {output} = await summarizeStudyMaterialPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid output. Please try again.');
    }
    // Validate that options array length matches correctAnswerIndex bounds
    output.multipleChoiceQuestions.forEach(mcq => {
      if (mcq.correctAnswerIndex < 0 || mcq.correctAnswerIndex >= mcq.options.length) {
        throw new Error(`Invalid correctAnswerIndex for question: "${mcq.question}". Index ${mcq.correctAnswerIndex} is out of bounds for ${mcq.options.length} options.`);
      }
    });
    return output;
  }
);

