
'use server';
/**
 * @fileOverview AI-powered YouTube video content processing.
 *
 * - processYouTubeVideo - Function to generate study materials from a video transcript.
 * - ProcessYouTubeVideoInput - Input type for the flow.
 * - ProcessYouTubeVideoOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MCQSchema } from '@/ai/schemas/quiz-tool-schemas'; // Reusing MCQ schema

export const ProcessYouTubeVideoInputSchema = z.object({
  youtubeUrl: z.string().url({ message: "Please enter a valid YouTube URL." }).optional().describe('The URL of the YouTube video (currently for context, not direct fetching).'),
  videoTranscript: z
    .string()
    .min(100, { message: "Transcript must be at least 100 characters." })
    .max(30000, { message: "Transcript is too long (max 30,000 characters)." }) // Increased limit
    .describe('The transcript of the YouTube video.'),
  customTitle: z.string().optional().describe('Optional: A custom title for the video if you want to override or provide one.'),
  userName: z.string().optional().describe("User's name for personalization."),
  examContext: z.string().optional().describe("User's exam context (e.g., NEET, UPSC) to tailor content focus and quiz difficulty."),
  language: z.string().optional().default('English').describe("The language of the transcript, to aid in processing."),
});
export type ProcessYouTubeVideoInput = z.infer<typeof ProcessYouTubeVideoInputSchema>;

export const ProcessYouTubeVideoOutputSchema = z.object({
  videoTitle: z.string().describe("The AI-generated or confirmed title of the video."),
  summary: z.string().describe('A concise summary of the video content, approximately 150-250 words.'),
  structuredNotes: z.string().describe('Well-structured notes from the video, formatted in Markdown with headings, subheadings, bullet points, and bolded keywords. These notes should be comprehensive yet digestible.'),
  keyConcepts: z.array(z.string()).min(3).max(10).describe("An array of 3-10 key concepts, terms, or important takeaways extracted from the video."),
  multipleChoiceQuestions: z.array(MCQSchema).min(2).max(5).describe("An array of 2-5 multiple-choice questions based on the video content, complete with options, correct answer index, and explanations.")
});
export type ProcessYouTubeVideoOutput = z.infer<typeof ProcessYouTubeVideoOutputSchema>;


export async function processYouTubeVideo(input: ProcessYouTubeVideoInput): Promise<ProcessYouTubeVideoOutput> {
  return processYouTubeVideoFlow(input);
}

const processVideoPrompt = ai.definePrompt({
  name: 'processYouTubeVideoPrompt',
  input: { schema: ProcessYouTubeVideoInputSchema },
  output: { schema: ProcessYouTubeVideoOutputSchema },
  prompt: `You are an expert AI Study Assistant specializing in transforming video transcripts into comprehensive learning materials for students preparing for exams like NEET, UPSC, JEE, etc.

Context:
- User: {{#if userName}}{{userName}}{{else}}Student{{/if}}
{{#if examContext}}- Exam Focus: {{examContext}} (Tailor content complexity and quiz relevance accordingly){{else}}- Exam Focus: General academic content{{/if}}
{{#if youtubeUrl}}- Original Video URL (for context): {{youtubeUrl}}{{/if}}
{{#if customTitle}}- Suggested Video Title: {{customTitle}}{{/if}}
- Transcript Language: {{language}}

Video Transcript to Process:
---
{{{videoTranscript}}}
---

Instructions:
Based on the provided video transcript, generate the following educational materials. Ensure clarity, accuracy, and helpfulness.

1.  **Video Title**:
    *   If a \`customTitle\` is provided, use it or refine it slightly if needed based on the transcript.
    *   If no \`customTitle\` is provided, generate a concise and descriptive title based on the transcript content.

2.  **Summary**:
    *   Write a comprehensive yet concise summary of the video's main topics and arguments (around 150-250 words).
    *   Highlight the core message or purpose of the video.

3.  **Structured Notes**:
    *   Create detailed, well-organized notes from the transcript.
    *   Use Markdown formatting extensively:
        *   Use headings (e.g., \`## Heading\`) and subheadings (\`### Subheading\`) to structure the content logically.
        *   Use bullet points (\`* \` or \`- \`) for lists of information, steps, or key details.
        *   Use bold (\`**text**\`) for important keywords, definitions, or terms.
        *   Ensure the notes are easy to read and follow, breaking down complex information.
    *   These notes should be more detailed than the summary and cover the main sections of the video.

4.  **Key Concepts**:
    *   Extract 3 to 10 important keywords, technical terms, or key concepts discussed in the video.
    *   List them as an array of strings.

5.  **Multiple Choice Questions (MCQs)**:
    *   Generate 2 to 5 MCQs based *only* on the information present in the provided transcript.
    *   Each MCQ must have:
        *   A clear \`question\` text.
        *   An array of 4 distinct \`options\`.
        *   The 0-based \`correctAnswerIndex\` for the options array.
        *   A brief \`explanation\` justifying the correct answer and, if relevant, why other options are incorrect.
    *   The difficulty of MCQs should be appropriate for a student, considering the \`examContext\` if provided.

---
Content Generation Guidelines:
- Authenticity & Validity: All generated content must accurately reflect the provided \`videoTranscript\`. Do not introduce external information.
- Structure & Formatting (within JSON string values, especially for 'structuredNotes'):
    - Adhere strictly to Markdown for notes. Use clear, engaging, and well-structured language.
    - For \`summary\`, \`keyConcepts\`, and MCQ \`question\`/\`explanation\`: Use concise language. You MAY use **bold** or *italics* for emphasis.
    - Relevant emojis (e.g., 💡, ✅, 🎯, 🤔, 🎬, 🔑) MAY be used sparingly to enhance engagement.
- Tone: Maintain a helpful, educational, and encouraging tone.
---

Output a single JSON object that strictly adheres to the ProcessYouTubeVideoOutputSchema.
Example for structuredNotes:
"## Main Topic 1\\n\\n- **Key Point 1.1**: Detail about this point.\\n- *Sub-point 1.1.1*: Further detail.\\n\\n## Main Topic 2\\n\\n- **Concept A**: Explanation of Concept A.\\n- **Concept B**: Explanation of Concept B."

Generate the study materials now.
`,
});

const processYouTubeVideoFlow = ai.defineFlow(
  {
    name: 'processYouTubeVideoFlow',
    inputSchema: ProcessYouTubeVideoInputSchema,
    outputSchema: ProcessYouTubeVideoOutputSchema,
  },
  async (input) => {
    const { output } = await processVideoPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return valid study material. Please try again.');
    }
    // Validate MCQ correctAnswerIndex
    output.multipleChoiceQuestions.forEach((mcq, index) => {
      if (mcq.correctAnswerIndex < 0 || mcq.correctAnswerIndex >= mcq.options.length) {
        console.error(`Invalid correctAnswerIndex for MCQ ${index + 1}: "${mcq.question}". Index: ${mcq.correctAnswerIndex}, Options: ${mcq.options.length}`);
        // Fallback or throw specific error
        mcq.correctAnswerIndex = 0; // Fallback to first option, or handle error more gracefully
        // Consider throwing an error here if strict validation is needed, or trying to regenerate.
      }
    });
    return output;
  }
);

    