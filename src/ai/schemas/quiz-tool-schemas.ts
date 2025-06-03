
import { z } from 'zod'; // Using direct zod import for schema definitions

export const QuizQuestionSchema = z.object({
  questionText: z.string().describe("The full text of the multiple-choice question. Should be engaging and clear."),
  options: z.array(z.string()).min(4, {message: "Must have at least 4 options."}).max(5, {message: "Maximum 5 options."}).describe("An array of 4 to 5 answer options. Only one is correct."),
  correctAnswerIndex: z.number().int().min(0).describe("The 0-based index of the correct answer in the 'options' array."),
  explanation: z.string().describe("A detailed explanation for why the correct answer is right, and ideally, why other common distractors are wrong. Should be helpful for learning. Use **bold** or _italics_ and relevant emojis like 💡 or ✅ for clarity and engagement.")
});

export const GenerateQuizInputSchema = z.object({
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters.' }).max(150, {message: 'Topic too long.'}),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']).describe("The difficulty level of the quiz: 'basic' (recall), 'intermediate' (application), 'advanced' (conceptual/tricky)."),
  examType: z.enum(['neet', 'jee', 'upsc_prelims', 'ssc_bank', 'cat', 'general']).describe("The target exam type to tailor question style: 'neet', 'jee', 'upsc_prelims', 'ssc_bank', 'cat', 'general' (for general knowledge or other exams)."),
  numQuestions: z.coerce.number().int().min(3, {message: 'Minimum 3 questions.'}).max(10, {message: 'Maximum 10 questions.'}).describe("The number of questions to generate (3-10).")
});

export const GenerateQuizOutputSchema = z.object({
  quizTitle: z.string().describe("An engaging title for the generated quiz, e.g., 'Deep Dive into Photosynthesis (Advanced)' or 'NEET Biology Challenge: Cell Structure'. Include emojis like 🧠 or 🎯 if appropriate."),
  questions: z.array(QuizQuestionSchema).describe("An array of quiz questions, each adhering to the QuizQuestion schema.")
});

// Export types from here as well
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;
