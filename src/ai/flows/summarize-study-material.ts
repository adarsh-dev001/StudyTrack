
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
  prompt: `You are an AI study assistant for students preparing for competitive exams.
{{#if userName}}Hello {{userName}}!{{/if}} Let's break down this study material on '{{topic}}'.

Student Profile (Context):
{{#if examType}}- Exam Focus: {{examType}}{{else}}- Exam Focus: General{{/if}}
{{#if userLevel}}- Preparation Level: {{userLevel}}{{else}}- Preparation Level: Not specified{{/if}}

User Request Type: material_processor
User's Query/Need (Material to Process):
---
{{{material}}}
---

Instructions:
Based on the student's profile context, the topic, and the provided material, please perform the following tasks:
1.  **Summary**: Write a concise summary of the material (100-200 words). Tailor focus to exam prep for {{#if examType}}{{examType}}{{else}}their exams{{/if}} at a {{#if userLevel}}{{userLevel}}{{else}}general{{/if}} level.
2.  **Key Concepts**: List 3-7 key concepts. Highlight concepts pertinent to the {{#if examType}}{{examType}}{{else}}general competitive exam{{/if}} context.
3.  **Structured Notes**: Create comprehensive, well-organized study notes from the material.
    *   **Formatting**: Use Markdown extensively and correctly.
        *   Employ headings (e.g., \`## Main Section Title\`) and subheadings (\`### Key Area\`) to structure content logically.
        *   Use bullet points (\`* \` or \`- \`) for lists, steps, or key details. Nested lists are good for complex topics.
        *   Use bold (\`**text**\`) for important keywords, definitions, or terms.
        *   Use italics (\`*text*\`) for emphasis or sub-definitions.
        *   Ensure notes are easy to read, breaking down complex info into digestible chunks.
        *   Make it visually appealing and suitable for direct study use.
    *   **Content**: Notes should be more detailed than the summary, covering main sections comprehensively and accurately reflecting the input material.
4.  **Multiple Choice Questions**: Generate 3-5 MCQs based *only* on the material. Difficulty and style appropriate for a {{#if userLevel}}{{userLevel}}{{else}}general{{/if}} student aiming for {{#if examType}}{{examType}}{{else}}exams{{/if}}. For each MCQ:
    *   Provide a clear \`questionText\`.
    *   Provide 4 distinct answer \`options\`.
    *   Indicate the 0-based \`correctAnswerIndex\`.
    *   Provide a brief \`explanation\` for the correct answer.

---
Content Generation Guidelines (for all string values in JSON):
- Authenticity & Validity: All content must accurately reflect the provided \`material\` and \`topic\`.
- Structure & Formatting:
    - For \`structuredNotes\`: Adhere strictly to Markdown (headings, lists, bold, italic).
    - For \`summary\`, \`keyConcepts\`, MCQ \`questionText\`/\`explanation\`: Use concise language. MAY use **bold** or *italics*.
    - Relevant emojis (e.g., 💡, ✅, 🎯, 🤔, 📚, 🔑) MAY be used sparingly and thematically to enhance engagement.
- Tone: Maintain a friendly, focused, and helpful tone.
- Clarity & Readability: Ensure all text is clear, concise, and easy to understand. MCQs should be unambiguous.
---

Output a JSON object strictly conforming to the SummarizeStudyMaterialOutputSchema.
Ensure the 'structuredNotes' field is populated with well-formatted Markdown notes.
Example for structuredNotes field (ensure to use newlines '\\n' correctly within the JSON string value):
"## Main Topic 1\\n\\n- **Key Point 1.1**: Detail about this point.💡\\n  - *Sub-point 1.1.1*: Further detail.\\n\\n## Main Topic 2 🏛️\\n\\n- **Concept A**: Explanation of Concept A.\\n- **Concept B**: Explanation of Concept B."
Focus on extracting the most important information and creating relevant, challenging MCQs and notes.
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
    return output;
  }
);

