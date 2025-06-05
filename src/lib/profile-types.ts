
import type { Timestamp } from 'firebase/firestore';

// Keep existing profile fields from other features
export interface UserProfileData {
  // From Streaks/Rewards & Auth
  email: string; // Made non-optional
  fullName?: string; // Will be populated during onboarding
  coins: number;
  xp: number;
  earnedBadgeIds: string[];
  purchasedItemIds: string[];
  activeThemeId?: string | null;
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } };

  // Onboarding/Profile Fields
  targetExams?: string[];
  otherExamName?: string;
  examAttemptYear?: string;
  languageMedium?: string;
  studyMode?: string;
  examPhase?: string;
  previousAttempts?: string;
  
  dailyStudyHours?: string;
  preferredStudyTime?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  distractionStruggles?: string;

  preferredLearningStyles?: string[];
  motivationType?: string;
  age?: number | null;
  location?: string;
  socialVisibilityPublic?: boolean;

  onboardingCompleted?: boolean;

  lastInteractionDates?: string[];
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Timestamp | null;
}
