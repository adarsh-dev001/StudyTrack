
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
  userName: z.string().optional().describe("The user's name for a personalized touch."),
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
  preferredLanguage: z.string().optional().describe("User's preferred language for study materials, if relevant for topic suggestions."),
  goals: z.string().optional().describe("User's broader study goals which might influence topic prioritization or phasing.")
});
export type SuggestStudyTopicsInput = z.infer<typeof SuggestStudyTopicsInputSchema>;

const SuggestStudyTopicsPromptInputSchema = SuggestStudyTopicsInputSchema.extend({
    currentDate: z.string().describe("The current date in YYYY-MM-DD format, used as a reference for planning by the AI."),
});

const WeeklyScheduleItemSchema = z.object({
  weekLabel: z.string().describe("The label for the week, e.g., 'Week 1', 'Week 2', 'Phase 1 - Week 1'."),
  topics: z.array(z.string().describe("Topic for this week. Include estimated hours if feasible, e.g., 'Topic X (4h)' or ensure weekly load matches time constraints.")),
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

// Simple in-memory cache with TTL
const topicSuggestionsCache = new Map<string, { data: SuggestStudyTopicsOutput, timestamp: number }>();
const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour

export async function suggestStudyTopics(input: SuggestStudyTopicsInput): Promise<SuggestStudyTopicsOutput> {
  const cacheKey = JSON.stringify(Object.entries(input).sort()); // Create a stable cache key
  const cachedEntry = topicSuggestionsCache.get(cacheKey);

  if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
    console.log('Returning cached study topic suggestions for key:', cacheKey);
    return cachedEntry.data;
  }

  console.log('Fetching fresh study topic suggestions for key:', cacheKey);
  const result = await suggestStudyTopicsFlow(input);
  topicSuggestionsCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
}

const prompt = ai.definePrompt({
  name: 'suggestStudyTopicsPrompt',
  input: {schema: SuggestStudyTopicsPromptInputSchema},
  output: {schema: SuggestStudyTopicsOutputSchema},
  prompt: `You are an AI study assistant for students preparing for competitive exams like JEE, NEET, CAT, SSC, and Banking exams.
{{#if userName}}Hello {{userName}}!{{/if}} Let's craft a study plan for you.

Student Profile:
- Exam: {{{examType}}}
- Subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Level: {{{preparationLevel}}}
- Target Completion Date: {{{targetDate}}} (Current Date: {{{currentDate}}})
{{#if preferredLanguage}}- Preferred Language: {{{preferredLanguage}}}{{/if}}
{{#if goals}}- Goals: {{{goals}}}{{/if}}
{{#if weakTopics.length}}- Weak Areas/Topics to Focus: {{#each weakTopics}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
- Study Time per Day: {{{timeAvailablePerDay}}} hours
{{#if studyMode}}- Preferred Study Mode: {{{studyMode}}}{{/if}}

User Request Type: syllabus_suggester
User’s Query/Need: "Generate a detailed, topic-wise weekly study plan for EACH selected subject, broken down into manageable phases leading up to the target completion date. Prioritize high-weightage topics first and consider my preparation level, weak areas, and overall goals."

Instructions:
Based on the student profile and request:
- Syllabus and difficulty must match the exam ({{{examType}}}).
- Respect weak areas ({{{weakTopics}}}), study time ({{{timeAvailablePerDay}}} hours/day), preparation level ({{{preparationLevel}}}), target date ({{{targetDate}}}), and goals ({{{goals}}}).
- Plan should be clear, concise, and practical.
- Break down syllabus into phases within weekly schedule for each subject, with topics progressing (foundational, core, advanced, revision).
- Prioritize high-weightage topics for {{{examType}}}, adjusted for user's level and weak topics.
- Schedule for each subject: array of weekly plans ('weekLabel', 'topics' array).
- List topics under 'topics' per week. Estimate study time or ensure reasonable load.
- Calculate total days available (from {{{currentDate}}} to {{{targetDate}}}) for realistic week count.

---
**Content Generation Guidelines (for string values in JSON):**
- For \`overallFeedback\`, \`SubjectSyllabusSchema.summary\`, and individual \`topics\` strings:
    - Use clear, engaging, motivational language.
    - MAY use **bold** (\`**text**\`) or _italic_ (\`*text*\`) for emphasis.
    - MAY use relevant emojis (e.g., 💡, ✅, 🚀, 🎯).
- Example Topic: "**Newton's Laws** (Core) - *6h* 🚀. Focus on problem-solving."
---

Output JSON strictly conforming to SuggestStudyTopicsOutputSchema.
'generatedSyllabus' array MUST contain one object for EACH subject in input (Subjects: {{#each subjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}).
Each object in 'generatedSyllabus' MUST have:
1.  \`subject\` field (string, matching a selected subject).
2.  \`schedule\` field (array of weekly plan objects as per schema).
3.  \`summary\` field (string, brief summary/focus for THIS subject's plan. If none, provide generic encouragement/note. MUST NOT be empty).
Optionally, include an 'overallFeedback' string for the entire plan.

Example for a single subject in 'generatedSyllabus':
{
  "subject": "Physics",
  "schedule": [
    { "weekLabel": "Phase 1: Foundations - Week 1", "topics": ["**Kinematics** (Important) - *10h*", "Units & Measurement (5h)"] },
    { "weekLabel": "Phase 1: Foundations - Week 2", "topics": ["Laws of Motion (12h) 💡", "Work, Energy, Power (8h)"] }
  ],
  "summary": "Phase 1 focuses on building a strong foundation in mechanics. **Practice numericals daily!** Consider your {{{preparationLevel}}} level when tackling these."
}

Generate the syllabus now. Ensure all requested subjects are present in the output with all required fields.
`,
});

const suggestStudyTopicsFlow = ai.defineFlow(
  {
    name: 'suggestStudyTopicsFlow',
    inputSchema: SuggestStudyTopicsInputSchema,
    outputSchema: SuggestStudyTopicsOutputSchema,
  },
  async (input: SuggestStudyTopicsInput): Promise<SuggestStudyTopicsOutput> => {
    const currentDateFormatted = format(new Date(), 'yyyy-MM-dd');
    const promptInput = {
      ...input,
      currentDate: currentDateFormatted,
    };
    const {output} = await prompt(promptInput);
    if (!output) {
        throw new Error("The AI model did not return valid syllabus data. Please try adjusting your inputs or try again later.");
    }
    const returnedSubjects = new Set(output.generatedSyllabus.map(s => s.subject));
    for (const requestedSubject of input.subjects) {
        if (!returnedSubjects.has(requestedSubject)) {
            console.error(`AI did not return syllabus for requested subject: ${requestedSubject}. Output:`, JSON.stringify(output, null, 2));
            throw new Error(`The AI did not generate a syllabus for the subject: ${requestedSubject}. Please try again or adjust inputs.`);
        }
    }
    for (const syllabusItem of output.generatedSyllabus) {
        if (syllabusItem.summary === undefined || syllabusItem.summary.trim() === "") {
            console.warn(`AI returned an empty or undefined summary for subject: ${syllabusItem.subject}. Setting a default.`);
            syllabusItem.summary = `Focus on consistent study for ${syllabusItem.subject}.`;
        }
    }
    return output;
  }
);

    