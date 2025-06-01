
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting study topics based on the exam, subjects, time constraints, and target date.
 *
 * - suggestStudyTopics - A function that takes exam details and returns a structured syllabus.
 * - SuggestStudyTopicsInput - The input type for the suggestStudyTopics function.
 * - SuggestStudyTopicsOutput - The return type for the suggestStudyTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { format } from 'date-fns';

const SuggestStudyTopicsInputSchema = z.object({
  examType: z
    .string()
    .describe('The type of exam the user is preparing for (e.g., NEET, UPSC, JEE).'),
  subjects: z
    .array(z.string())
    .min(1)
    .describe('An array of subjects the user wants a syllabus for.'),
  timeAvailablePerDay: z
    .number()
    .describe('Average hours available for study per day.'),
  targetDate: z
    .string()
    .describe('The target date for syllabus completion (e.g., YYYY-MM-DD).'),
});
export type SuggestStudyTopicsInput = z.infer<typeof SuggestStudyTopicsInputSchema>;

// Internal schema for the prompt, including the calculated currentDate
const SuggestStudyTopicsPromptInputSchema = SuggestStudyTopicsInputSchema.extend({
    currentDate: z.string().describe("The current date in YYYY-MM-DD format, used as a reference for planning by the AI.")
});

const WeeklyScheduleItemSchema = z.object({
  weekLabel: z.string().describe("The label for the week, e.g., 'Week 1', 'Week 2'."),
  topics: z.array(z.string().describe("Topic for this week. Include estimated hours if feasible, e.g., 'Topic X (4h)' or ensure weekly load matches time constraints.")),
});

const SubjectSyllabusSchema = z.object({
  subject: z.string().describe("The name of the subject."),
  schedule: z.array(WeeklyScheduleItemSchema).describe("A weekly breakdown of topics as an array of weekly plans."),
  summary: z.string().optional().describe("A brief summary or key focus areas for this subject's plan, or any important notes regarding the schedule.")
});

const SuggestStudyTopicsOutputSchema = z.object({
  generatedSyllabus: z.array(SubjectSyllabusSchema)
    .describe("An array of syllabi, one for each selected subject, structured by week."),
  overallFeedback: z.string().optional().describe("General feedback or advice on the generated study plan and how to approach it given the time constraints.")
});
export type SuggestStudyTopicsOutput = z.infer<typeof SuggestStudyTopicsOutputSchema>;

export async function suggestStudyTopics(input: SuggestStudyTopicsInput): Promise<SuggestStudyTopicsOutput> {
  return suggestStudyTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStudyTopicsPrompt',
  input: {schema: SuggestStudyTopicsPromptInputSchema}, // Use the extended schema for prompt input
  output: {schema: SuggestStudyTopicsOutputSchema},
  prompt: `You are an expert AI study planner. A student is preparing for the {{{examType}}} exam and needs a syllabus for the following subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.
They have approximately {{{timeAvailablePerDay}}} hours available for study each day and their target completion date is {{{targetDate}}}.

Based on this information, please generate a detailed, topic-wise weekly study plan for EACH selected subject.
Prioritize high-weightage topics first based on typical patterns for the {{{examType}}} exam.
The schedule for each subject should be an array of weekly plan objects. Each object in this array must have a 'weekLabel' (string, e.g., "Week 1", "Week 2") and a 'topics' (array of strings) property.
For each week, list the topics to be covered for that subject under the 'topics' array. If possible, indicate an estimated study time for topics or ensure the weekly load is reasonable given the daily study hours and target date.
The number of weeks should be realistic based on the target date and average daily study time.
Calculate the total number of days available from today (assume today is {{{currentDate}}}) until the targetDate. Then calculate total study weeks.

Output a JSON object strictly conforming to the SuggestStudyTopicsOutputSchema.
The 'generatedSyllabus' array must contain one object for each subject listed by the user.
Each object in 'generatedSyllabus' must have a 'subject' (string) and a 'schedule' (array of objects, where each object has 'weekLabel' and 'topics' array).
Optionally, include a 'summary' for each subject's plan and 'overallFeedback' for the entire plan.

Example for a single subject in the 'generatedSyllabus' array:
{
  "subject": "Physics",
  "schedule": [
    { "weekLabel": "Week 1", "topics": ["Kinematics (10h)", "Units & Measurement (5h)"] },
    { "weekLabel": "Week 2", "topics": ["Laws of Motion (12h)", "Work, Energy, Power (8h)"] }
  ],
  "summary": "Focus on conceptual understanding and problem-solving for mechanics first."
}

Remember to distribute topics appropriately across the weeks leading up to the target date, considering the daily study hours.
Provide a realistic and actionable plan.
`,
});

const suggestStudyTopicsFlow = ai.defineFlow(
  {
    name: 'suggestStudyTopicsFlow',
    inputSchema: SuggestStudyTopicsInputSchema, // External flow input remains the same
    outputSchema: SuggestStudyTopicsOutputSchema,
  },
  async (input: SuggestStudyTopicsInput) => {
    const currentDateFormatted = format(new Date(), 'yyyy-MM-dd');
    const promptInput = {
      ...input,
      currentDate: currentDateFormatted,
    };
    const {output} = await prompt(promptInput);
    return output!;
  }
);
