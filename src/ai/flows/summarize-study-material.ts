
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
  examType: z.string().optional().describe("The user's primary target exam type (e.g., NEET, UPSC) to help contextualize the summary."),
  userLevel: z.string().optional().describe("The user's general preparation level (e.g., beginner, intermediate) to tailor complexity."),
  userName: z.string().optional().describe("The user's name for a personalized touch.")
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
  prompt: `You are an AI study assistant for students preparing for competitive exams.
{{#if userName}}Hello {{userName}}!{{/if}} Let's break down this study material.

Student Profile (Context):
{{#if examType}}- Exam Focus: {{examType}}{{else}}- Exam Focus: General{{/if}}
{{#if userLevel}}- Preparation Level: {{userLevel}}{{else}}- Preparation Level: Not specified{{/if}}
- Topic of Material: {{topic}}

User Request Type: material_summarizer
User's Query/Need (Material to Process):
---
{{{material}}}
---

Instructions:
Based on the student's profile context, the topic, and the provided material, please perform the following tasks:
1.  **Summary**: Write a concise summary of the material, around 100-200 words. Tailor the focus of the summary to be most relevant for someone preparing for {{#if examType}}{{examType}}{{else}}their exams{{/if}} at a {{#if userLevel}}{{userLevel}}{{else}}general{{/if}} level.
2.  **Key Concepts**: List 5-7 key concepts from the material. Highlight concepts most pertinent to the {{#if examType}}{{examType}}{{else}}general competitive exam{{/if}} context, considering a {{#if userLevel}}{{userLevel}}{{else}}general{{/if}} understanding.
3.  **Multiple Choice Questions**: Generate 3-5 multiple-choice questions (MCQs) based on the material. The difficulty and style of MCQs should be appropriate for a {{#if userLevel}}{{userLevel}}{{else}}general{{/if}} level student aiming for the {{#if examType}}{{examType}}{{else}}exams{{/if}}. For each MCQ:
    *   Provide a clear question.
    *   Provide 4 distinct answer options.
    *   Clearly indicate the 0-based index of the correct answer within the options array.
    *   Provide a brief explanation for why the correct answer is right and, if relevant, why other choices might be incorrect.

---
Content Generation Guidelines:
- Authenticity & Validity: The summary, key concepts, and MCQs must be authentic and accurately reflect the provided \`material\` and \`topic\`.
- Structure & Formatting (within JSON string values):
    - For the \`summary\` field, the \`question\` and \`explanation\` fields within MCQs, and individual strings in the \`keyConcepts\` array:
        - Use clear, engaging, and well-structured language.
        - You MAY use **bold** text (using \`**text**\`) or _italic_ text (using \`*text*\` or \`_text_\`) for emphasis on key terms, definitions, or important parts of an explanation.
        - Incorporate relevant emojis (e.g., 💡, ✅, 🎯, 🤔, 🌱, 🔑) where appropriate.
- Tone: Maintain a friendly, focused, and helpful tone.
- Clarity & Readability: Ensure all text is clear, concise, and easy to understand. MCQs should be unambiguous.
---

Output a JSON object strictly conforming to the SummarizeStudyMaterialOutputSchema.
Focus on extracting the most important information and creating relevant, challenging MCQs appropriate for the user's context.
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
