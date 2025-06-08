
'use server';
/**
 * @fileOverview AI-powered YouTube video content processing.
 *
 * - processYouTubeVideo - Function to generate study materials from a video transcript.
 */

import { ai } from '@/ai/genkit';
// Import schemas and types from the dedicated schema file
import {
  ProcessYouTubeVideoInputSchema,
  ProcessYouTubeVideoOutputSchema,
  type ProcessYouTubeVideoInput, // Type-only import
  type ProcessYouTubeVideoOutput, // Type-only import
} from '@/ai/schemas/youtube-processing-schemas';

// Only export the async function
export async function processYouTubeVideo(input: ProcessYouTubeVideoInput): Promise<ProcessYouTubeVideoOutput> {
  return processYouTubeVideoFlow(input);
}

const processVideoPrompt = ai.definePrompt({
  name: 'processYouTubeVideoPrompt',
  input: { schema: ProcessYouTubeVideoInputSchema }, // Use imported schema
  output: { schema: ProcessYouTubeVideoOutputSchema }, // Use imported schema
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
        *   A clear \`questionText\` text.
        *   An array of 4 distinct \`options\`.
        *   The 0-based \`correctAnswerIndex\` for the options array.
        *   A brief \`explanation\` justifying the correct answer and, if relevant, why other options are incorrect.
    *   The difficulty of MCQs should be appropriate for a student, considering the \`examContext\` if provided.

---
Content Generation Guidelines:
- Authenticity & Validity: All generated content must accurately reflect the provided \`videoTranscript\`. Do not introduce external information.
- Structure & Formatting (within JSON string values, especially for 'structuredNotes'):
    - Adhere strictly to Markdown for notes. Use clear, engaging, and well-structured language.
    - For \`summary\`, \`keyConcepts\`, and MCQ \`questionText\`/\`explanation\`: Use concise language. You MAY use **bold** or *italics* for emphasis.
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
    inputSchema: ProcessYouTubeVideoInputSchema, // Use imported schema
    outputSchema: ProcessYouTubeVideoOutputSchema, // Use imported schema
  },
  async (input) => {
    const { output } = await processVideoPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return valid study material. Please try again.');
    }
    // Validate MCQ correctAnswerIndex
    output.multipleChoiceQuestions.forEach((mcq, index) => {
      if (mcq.correctAnswerIndex < 0 || mcq.correctAnswerIndex >= mcq.options.length) {
        console.error(`Invalid correctAnswerIndex for MCQ ${index + 1}: "${mcq.questionText}". Index: ${mcq.correctAnswerIndex}, Options: ${mcq.options.length}`);
        // Fallback or throw specific error
        mcq.correctAnswerIndex = 0; // Fallback to first option, or handle error more gracefully
      }
    });
    return output;
  }
);
