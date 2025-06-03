
import type { Timestamp } from 'firebase/firestore';

// Keep existing profile fields from other features
export interface UserProfileData {
  // From Streaks/Rewards
  coins: number;
  xp: number;
  earnedBadgeIds: string[];
  purchasedItemIds: string[];
  activeThemeId?: string | null;
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } };

  // Onboarding/Profile Fields
  fullName?: string;

  targetExams?: string[];
  otherExamName?: string; // For when 'other' is selected in targetExams
  examAttemptYear?: string;
  languageMedium?: string;
  studyMode?: string; // e.g., 'self_study', 'coaching', 'hybrid'
  examPhase?: string; // e.g., 'prelims', 'mains', 'not_started'
  
  dailyStudyHours?: string;
  preferredStudyTime?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];

  preferredLearningStyles?: string[];
  motivationType?: string;

  onboardingCompleted?: boolean;

  // New field for interaction tracking
  lastInteractionDates?: string[]; // Stores unique YYYY-MM-DD date strings
}

