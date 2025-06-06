'use server';
/**
 * @fileOverview AI-powered academic doubt solver.
 *
 * - solveAcademicDoubt - Function to get AI-driven explanations for academic questions.
 * - SolveAcademicDoubtInput - Input type for the flow.
 * - SolveAcademicDoubtOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { UserProfileData } from '@/lib/profile-types'; // Assuming this might be used for more context later

const SolveAcademicDoubtInputSchema = z.object({
  userQuery: z.string().min(5, { message: 'Question must be at least 5 characters.' }).max(500, {message: 'Question too long.'}),
  userName: z.string().optional().describe("User's name for personalization."),
  examType: z.string().optional().describe("User's primary target exam (e.g., JEE, NEET) to tailor explanation complexity and relevance."),
  subjectContext: z.string().optional().describe("The subject related to the doubt, if known."),
  preparationLevel: z.string().optional().describe("User's self-assessed preparation level (e.g., beginner, intermediate) for the subject or exam."),
});
export type SolveAcademicDoubtInput = z.infer<typeof SolveAcademicDoubtInputSchema>;

const SolveAcademicDoubtOutputSchema = z.object({
  explanation: z.string().describe("A clear, step-by-step explanation addressing the user's academic doubt, personalized to their context."),
  relatedTopics: z.array(z.string()).optional().describe("A few related topics or concepts the user might want to explore next."),
  confidenceScore: z.number().min(0).max(1).optional().describe("AI's confidence in the provided explanation (0.0 to 1.0).")
});
export type SolveAcademicDoubtOutput = z.infer<typeof SolveAcademicDoubtOutputSchema>;


export async function solveAcademicDoubt(input: SolveAcademicDoubtInput): Promise<SolveAcademicDoubtOutput> {
  return solveAcademicDoubtFlow(input);
}

const doubtSolverPrompt = ai.definePrompt({
  name: 'doubtSolverPrompt',
  input: { schema: SolveAcademicDoubtInputSchema },
  output: { schema: SolveAcademicDoubtOutputSchema },
  prompt: `You are an AI study assistant for students preparing for competitive exams like JEE, NEET, CAT, SSC, and Banking exams.

Student Profile:
- Name: {{#if userName}}{{userName}}{{else}}Student{{/if}}
- Exam: {{#if examType}}{{examType}}{{else}}General Knowledge{{/if}}
- Subject of Doubt: {{#if subjectContext}}{{subjectContext}}{{else}}Not specified{{/if}}
- Level: {{#if preparationLevel}}{{preparationLevel}}{{else}}Not specified{{/if}}

User Request Type: doubt_solver
User’s Query/Need: "{{userQuery}}"

Instructions:
Based on the above student profile and their query, provide a highly relevant and personalized answer. Your response should:
- Directly address the user's question: "{{userQuery}}".
- Be clear, concise, and practical for a student preparing for {{#if examType}}{{examType}}{{else}}competitive exams{{/if}}.
- Provide a step-by-step explanation if the question involves problem-solving or a complex concept. Break it down.
- Adapt the depth and complexity of the explanation based on the student's specified level ({{preparationLevel}}) and exam type ({{examType}}). For example, a 'beginner' might need more foundational details than an 'advanced' student.
- If possible, offer 1-2 related topics for further study.
- Maintain a supportive and encouraging tone.
- Avoid generic responses; use the context provided.
- For any mathematical equations or formulas, ensure they are clearly presented. You can use simple text-based representations (e.g., E = mc^2) or Markdown if the final display supports it.

Output a JSON object strictly conforming to the SolveAcademicDoubtOutputSchema.
If you are unsure or the question is outside academic scope, set a low confidenceScore and explain kindly.
`,
});

const solveAcademicDoubtFlow = ai.defineFlow(
  {
    name: 'solveAcademicDoubtFlow',
    inputSchema: SolveAcademicDoubtInputSchema,
    outputSchema: SolveAcademicDoubtOutputSchema,
  },
  async (input) => {
    const { output } = await doubtSolverPrompt(input);
    if (!output) {
      // Fallback or error handling if AI doesn't return expected output
      return {
        explanation: "I'm sorry, I couldn't process that request at the moment. Please try rephrasing or ask another question.",
        relatedTopics: [],
        confidenceScore: 0.1
      };
    }
    return output;
  }
);
