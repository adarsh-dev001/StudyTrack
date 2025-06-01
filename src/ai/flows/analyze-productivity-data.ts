
'use server';

/**
 * @fileOverview A productivity data analysis AI agent.
 *
 * - analyzeProductivityData - A function that handles the analysis of productivity data to provide personalized insights.
 * - AnalyzeProductivityDataInput - The input type for the analyzeProductivityData function.
 * - AnalyzeProductivityDataOutput - The return type for the analyzeProductivityData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeProductivityDataInputSchema = z.object({
  studyHours: z.number().describe('Total study hours in a week.'),
  topicsCompleted: z.number().describe('Total topics completed in a week.'),
  subjectWiseTimeDistribution: z
    .record(z.number())
    .describe('A record of time distribution across subjects, with subject names as keys and time in hours as values.'),
  streakLength: z.number().describe('Current streak length (in days) of daily study sessions.'),
  weeklyGoalsCompleted: z.number().describe('Number of weekly study goals completed.'),
});
export type AnalyzeProductivityDataInput = z.infer<typeof AnalyzeProductivityDataInputSchema>;

const AnalyzeProductivityDataOutputSchema = z.object({
  insights: z.array(
    z.string().describe('Personalized insights on how to improve learning efficiency, based on the provided data. These should highlight strong/weak subjects or detect drops in streaks/burnout signs.')
  ),
  overallAssessment: z
    .string()
    .describe('An overall assessment of the student’s productivity and study habits based on the data provided.'),
  recommendations: z.array(
    z
      .string()
      .describe(
        'Specific, actionable recommendations for improving study efficiency, such as time management tips, subject focus adjustments, or pomodoro session adjustments (e.g., "Try 3 Pomodoros instead of 5 today").'
      )
  ),
});
export type AnalyzeProductivityDataOutput = z.infer<typeof AnalyzeProductivityDataOutputSchema>;

export async function analyzeProductivityData(
  input: AnalyzeProductivityDataInput
): Promise<AnalyzeProductivityDataOutput> {
  return analyzeProductivityDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeProductivityDataPrompt',
  input: {schema: AnalyzeProductivityDataInputSchema},
  output: {schema: AnalyzeProductivityDataOutputSchema},
  prompt: `You are an AI study coach that specializes in student productivity and study habit analysis.
Analyze the student's productivity data from the last 7 days and provide personalized insights, an overall assessment, and actionable recommendations for improving their learning efficiency.

Student's Data:
- Total Study Hours: {{{studyHours}}}
- Topics Completed: {{{topicsCompleted}}}
- Subject-wise Time Distribution (Hours):
{{#each subjectWiseTimeDistribution}}
  - {{@key}}: {{{this}}}
{{/each}}
- Current Study Streak (Days): {{{streakLength}}}
- Weekly Goals Completed: {{{weeklyGoalsCompleted}}}

Based on this data:
1.  **Insights**: Identify patterns. Highlight strong subjects (where time spent aligns with topics completed or goals) and weak subjects (where time spent might be disproportionate to outcomes, or low time is allocated). Detect potential burnout signals like a significant drop in study hours compared to previous trends (if implied by low hours for a full week) or a broken streak (if streak is 0 or very low after being higher). Frame these as bullet points.
2.  **Overall Assessment**: Give a brief summary of the student's productivity for the week.
3.  **Recommendations**: Provide specific, actionable tips. For example, suggest revising a particular subject if it seems weak, or adjusting study session length (e.g., "Try 3 Pomodoros instead of 5 today" if hours are low or focus seems to be an issue). List these as bullet points.

Output must be a JSON object strictly conforming to the AnalyzeProductivityDataOutputSchema.
Ensure insights and recommendations are distinct and helpful.
`,
});

const analyzeProductivityDataFlow = ai.defineFlow(
  {
    name: 'analyzeProductivityDataFlow',
    inputSchema: AnalyzeProductivityDataInputSchema,
    outputSchema: AnalyzeProductivityDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error('The AI model did not return valid data. Please try again.');
    }
    return output;
  }
);

