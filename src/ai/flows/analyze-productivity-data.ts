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
    z.string().describe('Personalized insights on how to improve learning efficiency, based on the provided data.')
  ),
  overallAssessment: z
    .string()
    .describe('An overall assessment of the student’s productivity and study habits based on the data provided.'),
  recommendations: z.array(
    z
      .string()
      .describe(
        'Specific, actionable recommendations for improving study efficiency, such as time management tips or subject focus adjustments.'
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
  prompt: `You are an AI study coach that specializes in student productivity and study habit analysis. Analyze the student's productivity data and provide personalized insights and recommendations for improving their learning efficiency.

Here is the student's productivity data:

Study Hours: {{{studyHours}}}
Topics Completed: {{{topicsCompleted}}}
Subject-wise Time Distribution: {{#each (lookup subjectWiseTimeDistribution)}}
  {{@key}}: {{{this}}}
{{/each}}
Streak Length: {{{streakLength}}}
Weekly Goals Completed: {{{weeklyGoalsCompleted}}}

Provide the insights, overall assessment, and recommendations based on the above data. Focus on actionable advice for improved study habits and efficiency.  List each insight and recommendation as a separate bullet point.


Output must be a JSON object conforming to the AnalyzeProductivityDataOutputSchema schema.  The insights and recommendations should be specific and actionable, not generic.
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
    return output!;
  }
);
