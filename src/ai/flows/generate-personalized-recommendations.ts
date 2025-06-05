
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
import type { UserProfileData } from '@/lib/profile-types'; 
import { subjectDetailSchema } from '@/lib/profile-types';

const PersonalizedRecommendationsInputSchema = z.object({
  // Fields from Master Template Profile Section
  name: z.string().optional().describe("User's name."),
  targetExams: z.array(z.string()).optional().describe("User's target exams (e.g., NEET, UPSC). These are IDs like 'jee', 'neet'."),
  otherExamName: z.string().optional().describe("Specific exam name if 'Other' is selected in targetExams."),
  // subjects: z.array(z.string()).optional().describe("Subjects auto-selected based on exam type - this is usually implicit from targetExams or handled by subjectDetails."),
  // level: z.string().optional().describe("General preparation level (e.g., Beginner, Intermediate). This could be derived or a specific field."), // Prefer subjectDetails.preparationLevel
  examAttemptYear: z.string().optional().describe("Year the user plans to attempt the exam."),
  languageMedium: z.string().optional().describe("Language medium for the exam."),
  // goals: z.string().optional().describe("User's study goals."), // This is better captured by what the recommendations *output* as goals
  // weakTopics: z.array(z.string()).optional(), // Covered by subjectDetails or general weakSubjects
  dailyStudyHours: z.string().optional().describe("Average hours user can study per day (e.g., '2-4 hours')."),
  studyMode: z.string().optional().describe("Primary mode of study (e.g., 'self_study', 'coaching')."),
  
  // Additional specific fields from existing UserProfileData used for personalization
  examPhase: z.string().optional().describe("Current phase of exam preparation (e.g., 'prelims', 'mains')."),
  previousAttempts: z.string().optional().describe("Number of previous attempts for the target exam."),
  preferredStudyTime: z.array(z.string()).optional().describe("Preferred times for studying (e.g., ['morning', 'night'])."),
  
  weakSubjects: z.array(z.string()).optional().describe("General subjects the user finds challenging (use subjectDetails if available)."),
  strongSubjects: z.array(z.string()).optional().describe("General subjects the user is confident in (use subjectDetails if available)."),
  subjectDetails: z.array(subjectDetailSchema).optional().describe("Detailed information for each subject, including preparation level and preferred learning methods."),

  preferredLearningStyles: z.array(z.string()).optional().describe("General preferred learning methods. AI should prioritize per-subject methods from `subjectDetails` if available."),
  motivationType: z.string().optional().describe("What motivates the user (e.g., 'xp_badges', 'personal_goals')."),
  
  age: z.number().optional().nullable().describe("User's age."),
  location: z.string().optional().describe("User's location (city/region)."),
  distractionStruggles: z.string().optional().describe("User's main distraction struggles."),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const GoalSchema = z.object({
  goal: z.string().describe("Description of the goal."),
  timeline: z.string().optional().describe("Suggested timeline or timeframe for the goal (e.g., '1 week', 'next month').")
});

const PersonalizedRecommendationsOutputSchema = z.object({
  fallback: z.boolean().optional().describe("Indicates if the response is a fallback due to AI service issues."),
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
    subjectSpecificStudy: z.array(z.string()).min(1).max(3).describe("1-3 subject-specific study strategies, considering `subjectDetails` (prep level, preferred methods) and general weak/strong subjects if provided."),
    motivationalNudges: z.array(z.string()).min(1).max(3).describe("1-3 motivational nudges tailored to the user's motivation type."),
    focusAndDistraction: z.array(z.string()).min(1).max(3).describe("1-3 tips for managing focus and distractions, considering user's `distractionStruggles` if provided."),
  }).describe("A collection of personalized tips."),
  overallStrategyStatement: z.string().describe("A brief (2-3 sentences) overall strategic approach statement based on the user's profile and exam."),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;


export async function generatePersonalizedRecommendations(
  input: PersonalizedRecommendationsInput
): Promise<PersonalizedRecommendationsOutput> {
  // Format exam display string
  let examDisplay = input.targetExams?.join(', ');
  if (input.targetExams?.includes('other') && input.otherExamName) {
    examDisplay = input.targetExams.map(e => e === 'other' ? input.otherExamName : e).join(', ');
  }

  // Format subject details for easier templating if needed
  const subjectDetailsFormatted = input.subjectDetails?.map(sd => ({
    ...sd,
    preferredLearningMethodsFormatted: sd.preferredLearningMethods.join(', ')
  }));

  const flowInput = {
    ...input,
    examDisplay: examDisplay || 'Not specified', // Ensure examDisplay is always a string
    subjectDetailsFormatted,
  };

  return personalizedRecommendationsFlow(flowInput);
}

const recommendationsPrompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema.extend({ 
      examDisplay: z.string(), // Now required within the prompt input
      subjectDetailsFormatted: z.array(subjectDetailSchema.extend({ preferredLearningMethodsFormatted: z.string() })).optional(),
    }) 
  },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an expert AI Study Coach for students preparing for competitive exams like JEE, NEET, CAT, SSC, and Banking exams.

Student Profile:
- Name: {{#if name}}{{name}}{{else}}Student{{/if}}
- Target Exam(s): {{examDisplay}}
- Attempt Year: {{#if examAttemptYear}}{{examAttemptYear}}{{else}}Not specified{{/if}}
- Language Medium: {{#if languageMedium}}{{languageMedium}}{{else}}Not specified{{/if}}
- Current Exam Phase: {{#if examPhase}}{{examPhase}}{{else}}Not specified{{/if}}
- Study Mode: {{#if studyMode}}{{studyMode}}{{else}}Not specified{{/if}}
- Previous Attempts: {{#if previousAttempts}}{{previousAttempts}}{{else}}Not specified{{/if}}
- Daily Study Hours Available: {{#if dailyStudyHours}}{{dailyStudyHours}}{{else}}Not specified{{/if}}
- Preferred Study Times: {{#if preferredStudyTime}}{{#each preferredStudyTime}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Age: {{#if age}}{{age}}{{else}}Not specified{{/if}}
- Location: {{#if location}}{{location}}{{else}}Not specified{{/if}}
- General Strong Subjects: {{#if strongSubjects}}{{#each strongSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- General Weak Subjects: {{#if weakSubjects}}{{#each weakSubjects}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- General Preferred Learning Styles: {{#if preferredLearningStyles}}{{#each preferredLearningStyles}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Not specified{{/if}}
- Motivation Type: {{#if motivationType}}{{motivationType}}{{else}}Not specified{{/if}}
- Distraction Struggles: {{#if distractionStruggles}}{{distractionStruggles}}{{else}}Not specified{{/if}}

{{#if subjectDetailsFormatted.length}}
Detailed Subject Information:
{{#each subjectDetailsFormatted}}
  - Subject: **{{{this.subjectName}}}**
    - Preparation Level: {{{this.preparationLevel}}}
    - Target Score/Rank: {{#if this.targetScore}}{{{this.targetScore}}}{{else}}Not specified{{/if}}
    - Preferred Learning Methods: {{{this.preferredLearningMethodsFormatted}}}
{{/each}}
{{else}}
No detailed subject information provided.
{{/if}}

User Request Type: personalized_recommendations

Instructions:
Based on the above student profile and request type, provide a highly relevant and personalized set of study recommendations. Your response should:
- Match the syllabus and difficulty level of the user’s exam ({{examDisplay}}).
- Respect their weak areas, study time, and preferences.
- Be clear, concise, and practical for the user.
- Prioritize core subjects for {{examDisplay}}.
- If subject information is sparse, provide more general planning advice.
- If \`subjectDetails\` is available, use it as the primary source for subject-specific advice, overriding general \`weakSubjects\`, \`strongSubjects\`, and \`preferredLearningStyles\` where detailed per-subject info exists.

Please provide the following:
1.  **suggestedWeeklyTimetableFocus**: 3-7 bullet points. If subjectDetails are provided, use them to inform focus. Otherwise, use general strong/weak subjects.
2.  **suggestedMonthlyGoals**: 2-5 high-level goals.
3.  **studyCycleRecommendation**: A specific study-break cycle (e.g., 'Pomodoro: 25 min study / 5 min break').
4.  **shortTermGoals**: 2-4 actionable short-term goals with timelines.
5.  **longTermGoals**: 1-3 broader long-term goals with timelines.
6.  **milestoneSuggestions**: 2-4 strategic checkpoints.
7.  **personalizedTips**:
    *   timeManagement: 1-3 actionable time management tips.
    *   subjectSpecificStudy: 1-3 strategies. **Prioritize using \`subjectDetails\`**. For subjects marked with lower preparation levels (e.g., 'beginner'), suggest foundational strategies. For subjects with higher levels, suggest advanced techniques. Tailor advice to preferred learning methods for each subject. If \`subjectDetails\` is unavailable, fall back to general \`weakSubjects\`/\`strongSubjects\`.
    *   motivationalNudges: 1-3 nudges based on \`motivationType\`.
    *   focusAndDistraction: 1-3 tips considering \`distractionStruggles\`.
8.  **overallStrategyStatement**: A concise (2-3 sentences) strategic statement.

Structure your entire output as a single JSON object that strictly adheres to PersonalizedRecommendationsOutputSchema.
Ensure 'fallback' is not present unless explicitly set by the flow logic.
`,
});

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema.extend({ 
      examDisplay: z.string(),
      subjectDetailsFormatted: z.array(subjectDetailSchema.extend({ preferredLearningMethodsFormatted: z.string() })).optional(),
    }),
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input): Promise<PersonalizedRecommendationsOutput> => {
    let attempts = 0;
    let delay = INITIAL_DELAY_MS;

    while (attempts < MAX_RETRIES) {
      try {
        const { output } = await recommendationsPrompt(input);
        if (!output) {
          throw new Error('AI model did not return a valid output structure.');
        }
        return { ...output, fallback: false };
      } catch (error: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed for personalizedRecommendationsFlow: ${error.message}`);
        if (attempts >= MAX_RETRIES) {
          console.error("Max retries reached. Returning fallback recommendations.");
          // Fallback response
          return {
            fallback: true,
            suggestedWeeklyTimetableFocus: [
              "Focus on your core subjects this week.",
              "Ensure regular revision of topics already covered.",
              "Practice effective time management with dedicated study blocks."
            ],
            suggestedMonthlyGoals: [
              "Aim to cover a significant portion of your syllabus for at least one subject.",
              "Schedule and attempt at least one mock test or comprehensive quiz."
            ],
            studyCycleRecommendation: "Consider the Pomodoro Technique (e.g., 25 minutes study, 5 minutes break). Adjust based on your focus levels.",
            shortTermGoals: [
              { goal: "Complete one key module or unit of a core subject.", timeline: "This week" },
              { goal: "Review all notes from the past 3 days of study.", timeline: "Daily" }
            ],
            longTermGoals: [
              { goal: "Achieve mastery in fundamental concepts of all major subjects.", timeline: "Next 1-2 months" }
            ],
            milestoneSuggestions: [
              "End of Week: Conduct a self-assessment quiz on topics studied during the week.",
              "End of Month: Review all completed chapters and identify areas needing more attention."
            ],
            personalizedTips: {
              timeManagement: [
                "Prioritize your tasks daily using a to-do list or planner.",
                "Minimize distractions during your dedicated study sessions."
              ],
              subjectSpecificStudy: [
                "For complex topics, try breaking them down into smaller, manageable parts.",
                "Use active recall techniques like flashcards or teaching the concept to someone else."
              ],
              motivationalNudges: [
                "Keep your long-term exam goals in mind to stay focused.",
                "Acknowledge and celebrate small victories and progress made."
              ],
              focusAndDistraction: [
                "Identify your common distractions and create a plan to minimize them.",
                "Experiment with different study environments to find what helps you focus best."
              ]
            },
            overallStrategyStatement: "The AI coach is currently experiencing high demand and has provided a general plan. Please try again later for fully personalized recommendations. In the meantime, focus on consistent study habits, regular revision of material, and effective time management to make progress towards your exam goals."
          };
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; 
      }
    }
    // This part should ideally not be reached if MAX_RETRIES logic is correct
    return {
        fallback: true,
        suggestedWeeklyTimetableFocus: ["Generic focus 1", "Generic focus 2"],
        suggestedMonthlyGoals: ["Generic goal 1"],
        studyCycleRecommendation: "Standard Pomodoro",
        shortTermGoals: [{ goal: "Generic short term", timeline: "Soon" }],
        longTermGoals: [{ goal: "Generic long term", timeline: "Later" }],
        milestoneSuggestions: ["Generic milestone 1"],
        personalizedTips: {
            timeManagement: ["Generic time tip"],
            subjectSpecificStudy: ["Generic subject tip"],
            motivationalNudges: ["Generic nudge"],
            focusAndDistraction: ["Generic focus tip"]
        },
        overallStrategyStatement: "AI service is currently unavailable. Please try again later."
    };
  }
);
