
'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting study topics based on the exam, subjects, time constraints, target date, and other user profile aspects.
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
  preparationLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe("The student's general preparation level (Beginner, Intermediate, Advanced)."),
  studyMode: z
    .string()
    .optional()
    .describe('The student\'s preferred study mode (e.g., Self-study, Coaching, Hybrid).'),
  weakTopics: z
    .array(z.string())
    .optional()
    .describe('A list of topics the student considers weak or wants to focus on more.'),
  // Add other relevant fields from master template as needed, e.g., preferredLanguage, goals
});
export type SuggestStudyTopicsInput = z.infer<typeof SuggestStudyTopicsInputSchema>;

// Internal schema for the prompt, including the calculated currentDate
const SuggestStudyTopicsPromptInputSchema = SuggestStudyTopicsInputSchema.extend({
    currentDate: z.string().describe("The current date in YYYY-MM-DD format, used as a reference for planning by the AI."),
    // Add other fields that might be derived or always passed to prompt here
});

const WeeklyScheduleItemSchema = z.object({
  weekLabel: z.string().describe("The label for the week, e.g., 'Week 1', 'Week 2', 'Phase 1 - Week 1'."),
  topics: z.array(z.string().describe("Topic for this week. Include estimated hours if feasible, e.g., 'Topic X (4h)' or ensure weekly load matches time constraints.")),
  // Optionally add a phase property here if needed, or handle phasing in weekLabel/summary
});

const SubjectSyllabusSchema = z.object({
  subject: z.string().describe("The name of the subject."),
  schedule: z.array(WeeklyScheduleItemSchema).describe("A weekly breakdown of topics as an array of weekly plans. This schedule should implicitly represent phases of study."),
  summary: z.string().optional().describe("A brief summary or key focus areas for this subject's plan, or any important notes regarding the schedule, possibly mentioning study phases.")
});

const SuggestStudyTopicsOutputSchema = z.object({
  generatedSyllabus: z.array(SubjectSyllabusSchema)
    .describe("An array of syllabi, one for each selected subject, structured by week, reflecting different study phases."),
  overallFeedback: z.string().optional().describe("General feedback or advice on the generated study plan, considering the user's profile and how to approach the phases.")
});
export type SuggestStudyTopicsOutput = z.infer<typeof SuggestStudyTopicsOutputSchema>;

export async function suggestStudyTopics(input: SuggestStudyTopicsInput): Promise<SuggestStudyTopicsOutput> {
  return suggestStudyTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStudyTopicsPrompt',
  input: {schema: SuggestStudyTopicsPromptInputSchema}, 
  output: {schema: SuggestStudyTopicsOutputSchema},
  prompt: `You are an AI study assistant for students preparing for competitive exams like JEE, NEET, CAT, SSC, and Banking exams.

Student Profile:
- Exam: {{{examType}}}
- Subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Level: {{{preparationLevel}}}
- Target Year for Completion: {{{targetDate}}} (Assume current date is {{{currentDate}}})
{{#if studyMode}}- Preferred Study Mode: {{{studyMode}}}{{/if}}
{{#if weakTopics.length}}- Weak Areas/Topics to Focus: {{#each weakTopics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
- Study Time per Day: {{{timeAvailablePerDay}}} hours

User Request Type: syllabus_suggester
User’s Query/Need: "Generate a detailed, topic-wise weekly study plan for EACH selected subject, broken down into manageable phases leading up to the target completion date. Prioritize high-weightage topics first and consider my preparation level and weak areas."

Instructions:
Based on the above student profile and request type, provide a highly relevant and personalized output. Your response should:
- Match the syllabus and difficulty level of the user’s exam ({{{examType}}}).
- Respect their weak areas ({{{weakTopics}}}), study time ({{{timeAvailablePerDay}}} hours/day), preparation level ({{{preparationLevel}}}), and target date ({{{targetDate}}}).
- Be clear, concise, and practical for the user.
- Break down the syllabus into phases within the weekly schedule for each subject. This means the topics listed per week should naturally progress through different stages of learning (e.g., foundational, core concepts, advanced topics, revision).
- Prioritize high-weightage topics based on typical patterns for the {{{examType}}} exam, adjusting based on the user's preparation level and weak topics.
- The schedule for each subject should be an array of weekly plan objects. Each object in this array must have a 'weekLabel' (string, e.g., "Week 1", "Phase 1 - Week 2") and a 'topics' (array of strings) property.
- For each week, list the topics to be covered for that subject under the 'topics' array. If possible, indicate an estimated study time for topics or ensure the weekly load is reasonable.
- The number of weeks should be realistic based on the target date and average daily study time.
- Calculate the total number of days available from today ({{{currentDate}}}) until the targetDate. Then calculate total study weeks for planning.

---
**Content Generation Guidelines (for string values in JSON):**
- For \`overallFeedback\`, \`SubjectSyllabusSchema.summary\`, and individual \`topics\` strings:
    - Use clear, engaging, and motivational language.
    - MAY use **bold** (\`**text**\`) or _italic_ (\`*text*\`) for emphasis.
    - MAY incorporate relevant emojis (e.g., 💡, ✅, 🚀, 🎯).
- Example Topic String: "**Newton's Laws** (Core) - *6h* 🚀. Focus on problem-solving."
---

Output a JSON object strictly conforming to the SuggestStudyTopicsOutputSchema.
The 'generatedSyllabus' array must contain one object for each subject listed by the user.
Optionally, include a 'summary' for each subject's plan and 'overallFeedback' for the entire plan.

Example for a single subject in the 'generatedSyllabus' array:
{
  "subject": "Physics",
  "schedule": [
    { "weekLabel": "Phase 1: Foundations - Week 1", "topics": ["**Kinematics** (Important) - *10h*", "Units & Measurement (5h)"] },
    { "weekLabel": "Phase 1: Foundations - Week 2", "topics": ["Laws of Motion (12h) 💡", "Work, Energy, Power (8h)"] }
  ],
  "summary": "Phase 1 focuses on building a strong foundation in mechanics. **Practice numericals daily!** Consider your {{{preparationLevel}}} level when tackling these."
}

Generate the syllabus now.
`,
});

const suggestStudyTopicsFlow = ai.defineFlow(
  {
    name: 'suggestStudyTopicsFlow',
    inputSchema: SuggestStudyTopicsInputSchema, 
    outputSchema: SuggestStudyTopicsOutputSchema,
  },
  async (input: SuggestStudyTopicsInput) => {
    const currentDateFormatted = format(new Date(), 'yyyy-MM-dd');
    const promptInput = {
      ...input,
      currentDate: currentDateFormatted,
    };
    const {output} = await prompt(promptInput);
    if (!output) {
        throw new Error("The AI model did not return valid syllabus data. Please try adjusting your inputs or try again later.");
    }
    return output;
  }
);

