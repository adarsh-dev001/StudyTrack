
import type { Timestamp } from 'firebase/firestore';
import { z } from 'zod'; // Added Zod import

// Definition for subject-specific details
export const subjectDetailSchema = z.object({
  subjectId: z.string(), // e.g., 'physics', 'mathematics'
  subjectName: z.string(), // e.g., 'Physics', 'Mathematics'
  preparationLevel: z.string().min(1, "Preparation level is required."), // e.g., 'beginner', 'intermediate', 'advanced'
  targetScore: z.string().optional(), // e.g., '90%+', '150/180'
  preferredLearningMethods: z.array(z.string()).min(1, "At least one learning method is required."), // e.g., ['videos', 'mcqs']
});
export type SubjectDetail = z.infer<typeof subjectDetailSchema>;


export interface UserProfileData {
  email: string;
  fullName?: string;
  coins: number;
  xp: number;
  earnedBadgeIds: string[];
  purchasedItemIds: string[];
  activeThemeId?: string | null;
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } };
  lastInteractionDates?: string[];

  // Onboarding / Profile Fields - Step 1 (Personal & General Academic)
  age?: number | null;
  location?: string;
  languageMedium?: string;
  studyMode?: string;
  examPhase?: string;
  previousAttempts?: string;
  
  // Onboarding / Profile Fields - Step 2 (Exam Focus)
  targetExams?: string[]; // Stores IDs like 'jee', 'neet'
  otherExamName?: string;
  examAttemptYear?: string;

  // Onboarding / Profile Fields - Step 3 (Subject Details)
  subjectDetails?: SubjectDetail[];

  // Onboarding / Profile Fields - Step 4 (Study Habits & Preferences)
  dailyStudyHours?: string;
  preferredStudyTime?: string[]; // Stores IDs like 'morning', 'evening'
  distractionStruggles?: string;
  motivationType?: string;
  
  // General
  socialVisibilityPublic?: boolean;
  onboardingCompleted?: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Timestamp | null;
}

