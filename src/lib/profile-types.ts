
import type { Timestamp } from 'firebase/firestore';

// Keep existing profile fields from other features
export interface UserProfileData {
  // From Streaks/Rewards
  coins: number;
  xp: number;
  earnedBadgeIds: string[];
  purchasedItemIds: string[];
  activeThemeId?: string | null;
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } }; // Store completion date

  // Onboarding/Profile Fields
  fullName?: string;

  targetExams?: string[];
  otherExamName?: string; // For when 'other' is selected in targetExams
  examAttemptYear?: string;
  languageMedium?: string;
  studyMode?: string; // e.g., 'self_study', 'coaching', 'hybrid'
  examPhase?: string; // e.g., 'prelims', 'mains', 'not_started'
  previousAttempts?: string; // Added from settings
  
  dailyStudyHours?: string;
  preferredStudyTime?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  distractionStruggles?: string;

  preferredLearningStyles?: string[];
  motivationType?: string;
  age?: number | null; // Changed from string to number | null
  location?: string;
  socialVisibilityPublic?: boolean;

  onboardingCompleted?: boolean;

  // New field for interaction tracking
  lastInteractionDates?: string[]; // Stores unique YYYY-MM-DD date strings
}

