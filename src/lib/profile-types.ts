
import type { Timestamp } from 'firebase/firestore';

// Keep existing profile fields from other features
export interface UserProfileData {
  // From Streaks/Rewards
  coins: number;
  xp: number;
  earnedBadgeIds: string[];
  purchasedItemIds: string[]; // Soundtracks are free now, but field might be used for other items
  activeThemeId?: string | null;
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } };

  // Onboarding/Profile Fields
  fullName?: string; // Can be pre-filled from auth, but editable here
  // age?: number; // Example, can be added later
  // location?: string; // Example, can be added later

  targetExams?: string[];
  examAttemptYear?: string; // Storing as string as it's a selection
  languageMedium?: string;
  // optionalSubjects?: string[]; // For UPSC/PSC - can be added later
  // currentExamPhase?: 'prelims' | 'mains' | 'interview' | 'not_started'; // Can be added later
  // studyMode?: 'coaching' | 'self_study' | 'hybrid'; // Can be added later
  // previousAttempts?: number; // Can be added later

  dailyStudyHours?: string; // Storing as string from selection
  preferredStudyTime?: string[]; // IDs of preferred times
  weakSubjects?: string[]; // IDs of subjects
  strongSubjects?: string[]; // IDs of subjects

  preferredLearningStyles?: string[]; // IDs of learning styles
  motivationType?: string; // Value from MOTIVATION_TYPES

  // socialVisibility?: 'public' | 'friends_only' | 'private'; // Can be added later
  // distractionStruggles?: string[]; // Can be added later

  onboardingCompleted?: boolean;
}
