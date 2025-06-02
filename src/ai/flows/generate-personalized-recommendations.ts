
'use server';
/**
 * @fileOverview Generates personalized study recommendations based on user profile.
 *
 * - generatePersonalizedRecommendations - Function to get AI-driven study advice.
 * - PersonalizedRecommendationsInput - Input type for the flow.
 * - PersonalizedRecommendationsOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { UserProfileData } from '@/lib/profile-types'; // Assuming this has all necessary fields

// Define the input schema based on relevant fields from UserProfileData
const PersonalizedRecommendationsInputSchema = z.object({
  targetExams: z.array(z.string()).optional().describe("User's target exams (e.g., NEET, UPSC)."),
  otherExamName: z.string().optional().describe("Specific exam name if 'Other' is selected."),
  examAttemptYear: z.string().optional().describe("Year the user plans to attempt the exam."),
  dailyStudyHours: z.string().optional().describe("Average hours user can study per day (e.g., '2-4 hours')."),
  preferredStudyTime: z.array(z.string()).optional().describe("Preferred times for studying (e.g., ['morning', 'night'])."),
  weakSubjects: z.array(z.string()).optional().describe("Subjects the user finds challenging."),
  strongSubjects: z.array(z.string()).optional().describe("Subjects the user is confident in."),
  preferredLearningStyles: z.array(z.string()).optional().describe("Preferred learning methods (e.g., ['videos', 'notes'])."),
  motivationType: z.string().optional().describe("What motivates the user (e.g., 'xp_badges', 'personal_goals')."),
  // Add other relevant fields from UserProfileData as needed by the prompt
  languageMedium: z.string().optional().describe("Language medium for the exam."),
  studyMode: z.string().optional().describe("Primary mode of study (e.g., 'self_study', 'coaching')."),
  examPhase: z.string().optional().describe("Current phase of exam preparation (e.g., 'prelims', 'mains')."),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const GoalSchema = z.object({
  goal: z.string().describe("Description of the goal."),
  timeline: z.string().optional().describe("Suggested timeline or timeframe for the goal (e.g., '1 week', 'next month').")
});

const PersonalizedRecommendationsOutputSchema = z.object({
  suggestedWeeklyTimetableFocus: z.array(z.string()).min(3).max(7)
    .describe("An array of 3-7 bullet points outlining key focus areas or subjects for a typical study week. Be generic enough if specific subject list is short."),
  suggestedMonthlyGoals: z.array(z.string()).min(2).max(5)
    .describe("An array of 2-5 high-level goals for a typical study month."),
  studyCycleRecommendation: z.string()
    .describe("A specific recommendation for study-break cycles (e.g., 'Pomodoro: 25 min study / 5 min break', or 'Custom: 50 min study / 10 min break')."),
  shortTermGoals: z.array(GoalSchema).min(2).max(4)
    .describe("An array of 2-4 actionable short-term goals (e.g., complete a specific unit, take a practice quiz)."),
  longTermGoals: z.array(GoalSchema).min(1).max(3)
    .describe("An array of 1-3 broader long-term goals (e.g., complete syllabus section, achieve target mock score)."),
  milestoneSuggestions: z.array(z.string()).min(2).max(4)
    .describe("An array of 2-4 strategic milestone checkpoints (e.g., 'Mock Test - Week 4', 'Full Syllabus Revision 1 - Month 2')."),
  personalizedTips: z.object({
    timeManagement: z.array(z.string()).min(1).max(3).describe("1-3 actionable time management tips."),
    subjectSpecificStudy: z.array(z.string()).min(1).max(3).describe("1-3 subject-specific study strategies, considering weak/strong subjects if provided."),
    motivationalNudges: z.array(z.string()).min(1).max(3).describe("1-3 motivational nudges tailored to the user's motivation type."),
  }).describe("A collection of personalized tips."),
  overallStrategyStatement: z.string().describe("A brief (2-3 sentences) overall strategic approach statement based on the user's profile and exam."),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;


export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  // Basic validation or transformation if needed before calling the flow
  // For example, combine targetExams and otherExamName if 'other' is present
  let examDisplay = input.targetExams?.join(', ');
  if (input.targetExams?.includes('other') && input.otherExamName) {
    examDisplay = input.targetExams.map(e => e === 'other' ? input.otherExamName : e).join(', ');
  }

  const flowInput = {
    ...input,
    examDisplay, // Pass a combined display name for exams
  };

  return personalizedRecommendationsFlow(flowInput);
}

const recommendationsPrompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema.extend({ examDisplay: z.string().optional() }) },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an expert AI Study Coach for competitive exam aspirants. Based on the following user profile, generate a personalized set of study recommendations.

User Profile:
- Target Exam(s): {{{examDisplay}}} (Attempt Year: {{{examAttemptYear}}})
- Language Medium: {{{languageMedium}}}
- Current Exam Phase: {{{examPhase}}}
- Study Mode: {{{studyMode}}}
- Daily Study Hours Available: {{{dailyStudyHours}}}
- Preferred Study Times: {{#if preferredStudyTime}}{{#each preferredStudyTime}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Strong Subjects: {{#if strongSubjects}}{{#each strongSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Weak Subjects: {{#if weakSubjects}}{{#each weakSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Preferred Learning Styles: {{#if preferredLearningStyles}}{{#each preferredLearningStyles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Motivation Type: {{{motivationType}}}

Please provide the following, ensuring they are tailored to the user's specific exam type and preferences:

1.  **suggestedWeeklyTimetableFocus**: 3-7 bullet points for a typical week's focus. Be specific if subjects are known, otherwise general study blocks.
2.  **suggestedMonthlyGoals**: 2-5 high-level goals for a month.
3.  **studyCycleRecommendation**: A specific study-break cycle (e.g., "Pomodoro: 25 min study / 5 min break").
4.  **shortTermGoals**: 2-4 actionable short-term goals (e.g., "Complete Unit X of Physics in 7 days"). Each goal should have a 'goal' and 'timeline' attribute.
5.  **longTermGoals**: 1-3 broader long-term goals (e.g., "Finish Part A of {{{examDisplay}}} syllabus 2 months before exam"). Each goal should have a 'goal' and 'timeline'.
6.  **milestoneSuggestions**: 2-4 strategic checkpoints (e.g., "Schedule first full-length mock test after 6 weeks", "Begin revision of all {{{strongSubjects}}} by end of Month 1").
7.  **personalizedTips**:
    *   timeManagement: 1-3 actionable time management tips.
    *   subjectSpecificStudy: 1-3 strategies, considering weak/strong subjects (e.g., "For {{{weakSubjects.[0]}}}, try using Feynman technique."). If no subjects, give general advice.
    *   motivationalNudges: 1-3 nudges. If motivationType is 'xp_badges', suggest tracking progress. If 'calm_mode', suggest minimizing distractions.
8.  **overallStrategyStatement**: A concise (2-3 sentences) strategic statement summarizing the approach.

Structure your entire output as a single JSON object that strictly adheres to the PersonalizedRecommendationsOutputSchema.
Ensure the advice is practical and actionable for the user preparing for {{{examDisplay}}}.
Prioritize core subjects for the given exam. For example, for NEET, focus on Physics, Chemistry, Biology. For UPSC, general studies and optionals.
If subject information is sparse, provide more general planning advice.
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema.extend({ examDisplay: z.string().optional() }),
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationsPrompt(input);
    if (!output) {
      throw new Error('The AI model did not return any recommendations. Please try again.');
    }
    return output;
  }
);
