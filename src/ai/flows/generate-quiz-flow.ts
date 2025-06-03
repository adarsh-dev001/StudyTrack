
'use server';
/**
 * @fileOverview AI-powered quiz generation flow.
 *
 * - generateQuiz - A function that handles quiz generation based on topic, difficulty, exam type, and number of questions.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 * - QuizQuestion - The type for a single quiz question.
 */

import { ai } from '@/ai/genkit';
// Import schema objects and types from the new schemas file
import {
  GenerateQuizInputSchema,
  GenerateQuizOutputSchema,
  type GenerateQuizInput,
  type GenerateQuizOutput,
  // type QuizQuestion // This type is part of GenerateQuizOutput implicitly
} from '@/ai/schemas/quiz-tool-schemas';

// Re-export types if client components specifically import them from this flow file.
// Alternatively, client components can import types directly from '@/ai/schemas/quiz-tool-schemas'.
export type { GenerateQuizInput, GenerateQuizOutput, QuizQuestion } from '@/ai/schemas/quiz-tool-schemas';


export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: { schema: GenerateQuizInputSchema },
  output: { schema: GenerateQuizOutputSchema },
  prompt: `You are an expert QuizMaster AI specializing in creating educational quizzes for competitive exam aspirants in India (NEET, JEE, UPSC, SSC, CAT, etc.).
Your task is to generate a quiz based on the following parameters:

Topic: {{{topic}}}
Difficulty: {{{difficulty}}}
Exam Type: {{{examType}}}
Number of Questions: {{{numQuestions}}}

**Instructions:**

1.  **Quiz Title:** Create an engaging \\\`quizTitle\\\` that reflects the topic, difficulty, and exam type. For example, "NEET Biology Challenge: {{{topic}}} ({{{difficulty}}})" or "UPSC Prelims - Modern History: {{{topic}}}". Include relevant emojis (e.g., 🧠, 🎯, 📚).
2.  **Questions:**
    *   Generate exactly {{{numQuestions}}} multiple-choice questions.
    *   **Relevance & Authenticity:** Each \\\`questionText\\\` must be highly relevant to the given \\\`topic\\\`, \\\`difficulty\\\`, and \\\`examType\\\`. Ensure questions are factually accurate and valid.
    *   **Difficulty Scaling:**
        *   \\\`basic\\\`: Focus on recall, definitions, direct facts, or simple formulas.
        *   \\\`intermediate\\\`: Require comprehension, application of concepts, or simple analysis.
        *   \\\`advanced\\\`: Demand conceptual understanding, critical thinking, multi-step problem-solving, or assess nuanced understanding. For UPSC, this could involve questions testing analytical skills.
    *   **Exam Type Adaptation:**
        *   \\\`neet\\\`/\`jee\\\`: Conceptual, application-based questions, often scientific or numerical. Options should be clear and distinct. Typically 4 options.
        *   \\\`upsc_prelims\\\`: Questions can be analytical, statement-based (though for this MCQ format, focus on a single best answer from 4-5 options). Avoid overly complex "match the following" or "which of the above are correct" if it complicates the single correctAnswerIndex.
        *   \\\`ssc_bank\\\`/\`cat\\\`/\`general\\\`: Tailor question style to common patterns in these exams (e.g., quantitative aptitude, logical reasoning, general awareness, vocabulary for CAT/Bank).
    *   **Options:** Provide 4 to 5 distinct answer \\\`options\\\` for each question. Ensure only ONE option is unequivocally correct.
    *   **Correct Answer:** Specify the 0-based \\\`correctAnswerIndex\\\`.
    *   **Explanation:** Craft a clear and comprehensive \\\`explanation\\\` for each question. Explain *why* the correct answer is correct and, if useful, why common distractors are incorrect. This is crucial for learning.
    *   **Engaging Content:** For \\\`questionText\\\` and \\\`explanation\\\`, use clear, concise language. You MAY use **bold** text (e.g., \\\`**Keyword**\\\`) or *italic* text (e.g., \\\`*concept*\\\`) for emphasis. Incorporate relevant emojis (e.g., 🤔, ✅, 💡, 📚, 🎯, 🚀) where appropriate to make the content more engaging.

**Output Format:**
Your entire response MUST be a single JSON object that strictly adheres to the GenerateQuizOutputSchema.

Example of a single question object within the 'questions' array:
\\\`\\\`\\\`json
{
  "questionText": "Which of the following is the **primary** site of photosynthesis in most plants? 🌱",
  "options": ["Roots", "Stem", "Leaves", "Flowers"],
  "correctAnswerIndex": 2,
  "explanation": "The **leaves** are the primary site of photosynthesis. They contain _chloroplasts_ which house chlorophyll, the pigment essential for capturing light energy. 💡 While some stems can photosynthesize, leaves are specialized for this process. Roots absorb water, and flowers are for reproduction. ✅"
}
\\\`\\\`\\\`

Generate the quiz now.
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async (input) => {
    const { output } = await generateQuizPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid quiz structure. Please try again.');
    }
    // Validate each question
    output.questions.forEach((q, index) => {
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        console.error(`Invalid correctAnswerIndex for question ${index + 1}: "${q.questionText}". Index: ${q.correctAnswerIndex}, Options: ${q.options.length}`);
        throw new Error(`AI returned an invalid correctAnswerIndex for question ${index + 1}. Please regenerate the quiz.`);
      }
    });
    return output;
  }
);

