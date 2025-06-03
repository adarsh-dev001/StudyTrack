
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
import { z } from 'genkit';

export const GenerateQuizInputSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }).max(150, {message: 'Topic too long.'}),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']).describe("The difficulty level of the quiz: 'basic' (recall), 'intermediate' (application), 'advanced' (conceptual/tricky)."),
  examType: z.enum(['neet', 'jee', 'upsc_prelims', 'ssc_bank', 'cat', 'general']).describe("The target exam type to tailor question style: 'neet', 'jee', 'upsc_prelims', 'ssc_bank', 'cat', 'general' (for general knowledge or other exams)."),
  numQuestions: z.coerce.number().int().min(3, {message: 'Minimum 3 questions.'}).max(10, {message: 'Maximum 10 questions.'}).describe("The number of questions to generate (3-10).")
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

export const QuizQuestionSchema = z.object({
  questionText: z.string().describe("The full text of the multiple-choice question. Should be engaging and clear."),
  options: z.array(z.string()).min(4, {message: "Must have at least 4 options."}).max(5, {message: "Maximum 5 options."}).describe("An array of 4 to 5 answer options. Only one is correct."),
  correctAnswerIndex: z.number().int().min(0).describe("The 0-based index of the correct answer in the 'options' array."),
  explanation: z.string().describe("A detailed explanation for why the correct answer is right, and ideally, why other common distractors are wrong. Should be helpful for learning. Use **bold** or _italics_ and relevant emojis like 💡 or ✅ for clarity and engagement.")
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe("An engaging title for the generated quiz, e.g., 'Deep Dive into Photosynthesis (Advanced)' or 'NEET Biology Challenge: Cell Structure'. Include emojis like 🧠 or 🎯 if appropriate."),
  questions: z.array(QuizQuestionSchema).describe("An array of quiz questions, each adhering to the QuizQuestion schema.")
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

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
\`\`\`json
{
  "questionText": "Which of the following is the **primary** site of photosynthesis in most plants? 🌱",
  "options": ["Roots", "Stem", "Leaves", "Flowers"],
  "correctAnswerIndex": 2,
  "explanation": "The **leaves** are the primary site of photosynthesis. They contain _chloroplasts_ which house chlorophyll, the pigment essential for capturing light energy. 💡 While some stems can photosynthesize, leaves are specialized for this process. Roots absorb water, and flowers are for reproduction. ✅"
}
\`\`\`

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

