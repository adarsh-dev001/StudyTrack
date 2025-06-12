
'use server';
/**
 * @fileOverview A study material analysis AI agent.
 *
 * - summarizeStudyMaterial - A function that handles summarizing material, extracting key concepts, generating structured notes, and MCQs.
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
  questionText: z.string().describe("The MCQ question text."),
  options: z.array(z.string()).min(3).max(5).describe("An array of 3-5 answer options."),
  correctAnswerIndex: z.number().int().min(0).describe("The 0-based index of the correct answer in the options array."),
  explanation: z.string().optional().describe("A brief explanation for why the answer is correct and/or why other options are incorrect.")
});
export type MCQ = z.infer<typeof MCQSchema>;

const SummarizeStudyMaterialOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the study material, approximately 100-200 words.'),
  keyConcepts: z.array(z.string()).min(3).max(7).describe("An array of 3-7 bullet points highlighting the key concepts from the material."),
  structuredNotes: z.string().describe('Well-organized notes from the material, formatted in Markdown with headings (e.g., ## Section), subheadings (e.g., ### Subsection), bullet points (* Item), bold (**text**), and italics (*text*). These notes should be comprehensive yet digestible and visually appealing, suitable for direct study use.'),
  multipleChoiceQuestions: z.array(MCQSchema).min(3).max(5).describe("An array of 3-5 multiple-choice questions based on the material. Each MCQ should have a questionText, options, the index of the correct option, and an explanation.")
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
  prompt: `You are an AI study assistant for competitive exam preparation.
{{#if userName}}Hello {{userName}}! {{/if}}Process this study material on '{{topic}}'.

Context:
{{#if examType}}- Exam: {{examType}}{{else}}- Exam: General{{/if}}
{{#if userLevel}}- Level: {{userLevel}}{{else}}- Level: Not specified{{/if}}

Material to Process:
---
{{{material}}}
---

Instructions:
Generate the following based on the material:
1.  **Summary**: Concise (100-200 words). Focus relevant to {{#if examType}}{{examType}}{{else}}exams{{/if}} at {{#if userLevel}}{{userLevel}}{{else}}a general{{/if}} level.
2.  **Key Concepts**: 3-7 bullet points. Prioritize concepts for {{#if examType}}{{examType}}{{else}}competitive exams{{/if}}.
3.  **Structured Notes**: Comprehensive, well-organized Markdown notes (headings ##, ###; lists *, -; bold **text**; italic *text*). Notes should be detailed, readable, and cover main sections.
4.  **Multiple Choice Questions**: 3-5 MCQs *solely from the material*. Difficulty appropriate for {{#if userLevel}}{{userLevel}}{{else}}a general{{/if}} student for {{#if examType}}{{examType}}{{else}}exams{{/if}}. Each MCQ: \`questionText\`, 4 \`options\`, 0-based \`correctAnswerIndex\`, brief \`explanation\`.

---
Content Guidelines (for JSON string values):
- Authenticity: All content must strictly reflect the input \`material\` and \`topic\`.
- Markdown for Notes: Use headings, lists, bold, italics correctly.
- Other Text: Concise. May use **bold** or *italics*. Relevant emojis (💡, ✅, 🎯, 🤔, 📚, 🔑) sparingly.
- Tone: Friendly, focused, helpful.
- Clarity: Clear, easy to understand. Unambiguous MCQs.
---

Output JSON strictly conforming to SummarizeStudyMaterialOutputSchema.
'structuredNotes' must be well-formatted Markdown. Example:
"## Topic 1\\n\\n- **Point 1.1**: Detail 💡.\\n  - *Sub-point 1.1.1*: More detail.\\n\\n## Topic 2 🏛️\\n\\n- **Concept A**: Explanation."
Extract crucial information for relevant, challenging notes and MCQs.
`,
});

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const summarizeStudyMaterialFlow = ai.defineFlow(
  {
    name: 'summarizeStudyMaterialFlow',
    inputSchema: SummarizeStudyMaterialInputSchema,
    outputSchema: SummarizeStudyMaterialOutputSchema,
  },
  async input => {
    let attempts = 0;
    let delay = INITIAL_DELAY_MS;

    while (attempts < MAX_RETRIES) {
      try {
        const { output } = await summarizeStudyMaterialPrompt(input);
        if (!output) {
          throw new Error('AI model did not return a valid output structure.');
        }
        // Validate that options array length matches correctAnswerIndex bounds
        output.multipleChoiceQuestions.forEach((mcq, index) => {
          if (mcq.correctAnswerIndex < 0 || mcq.correctAnswerIndex >= mcq.options.length) {
            console.error(`Invalid correctAnswerIndex for question ${index + 1}: "${mcq.questionText}". Index: ${mcq.correctAnswerIndex}, Options: ${mcq.options.length}. Setting to 0.`);
            mcq.correctAnswerIndex = 0; // Fallback to first option to prevent crash
          }
        });
        if (!output.structuredNotes || output.structuredNotes.trim() === "") {
            console.warn("AI did not return structured notes or returned empty notes. Setting a default placeholder.");
            output.structuredNotes = "## Notes\n\n- The AI could not generate structured notes for this material at the moment. Please try again or with different material.\n- Ensure the input material is clear and sufficiently long.";
        }
        return output; // Success
      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed for summarizeStudyMaterialFlow: ${error.message}`);
        if (attempts >= MAX_RETRIES) {
          // Log the final error and re-throw to be caught by the caller
          console.error(`Failed to summarize material after ${MAX_RETRIES} attempts for input:`, input);
          throw new Error(`Failed to summarize material after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        // Wait for the delay before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    // This line should theoretically not be reached if the loop logic correctly re-throws the error.
    // Added as a safeguard.
    throw new Error('Exhausted retries for summarizeStudyMaterialFlow without success.');
  }
);

    