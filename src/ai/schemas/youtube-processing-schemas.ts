
// NO 'use server'; directive here
import { z } from 'zod';
import { QuizQuestionSchema } from '@/ai/schemas/quiz-tool-schemas';

export const ProcessYouTubeVideoInputSchema = z.object({
  youtubeUrl: z.string().url({ message: "Please enter a valid YouTube URL." }).optional().describe('The URL of the YouTube video (currently for context, not direct fetching).'),
  videoTranscript: z
    .string()
    .min(100, { message: "Transcript must be at least 100 characters." })
    .max(30000, { message: "Transcript is too long (max 30,000 characters)." })
    .describe('The transcript of the YouTube video.'),
  customTitle: z.string().optional().describe('Optional: A custom title for the video if you want to override or provide one.'),
  userName: z.string().optional().describe("User's name for personalization."),
  examContext: z.string().optional().describe("User's exam context (e.g., NEET, UPSC) to tailor content focus and quiz difficulty."),
  language: z.string().optional().default('English').describe("The language of the transcript, to aid in processing."),
});
export type ProcessYouTubeVideoInput = z.infer<typeof ProcessYouTubeVideoInputSchema>;

export const ProcessYouTubeVideoOutputSchema = z.object({
  videoTitle: z.string().describe("The AI-generated or confirmed title of the video."),
  summary: z.string().describe('A concise summary of the video content, approximately 150-250 words.'),
  structuredNotes: z.string().describe('Well-structured notes from the video, formatted in Markdown with headings, subheadings, bullet points, and bolded keywords. These notes should be comprehensive yet digestible.'),
  keyConcepts: z.array(z.string()).min(3).max(10).describe("An array of 3-10 key concepts, terms, or important takeaways extracted from the video."),
  multipleChoiceQuestions: z.array(QuizQuestionSchema).min(2).max(5).describe("An array of 2-5 multiple-choice questions based on the video content, complete with options, correct answer index, and explanations.")
});
export type ProcessYouTubeVideoOutput = z.infer<typeof ProcessYouTubeVideoOutputSchema>;
