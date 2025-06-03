
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';
import type { UserProfileData, StreakData } from './profile-types'; // Updated import

const MAX_INTERACTION_DATES_STORED = 14; // Store a bit more than 7 for robust checking

export interface UnlockStatus {
  unlocked: boolean;
  displayProgress: number; // Progress towards 7
  progressTarget: number; // Always 7 for this feature
  message: string;
  unlockReason: 'study_streak' | 'interaction_streak' | 'none' | 'both';
  studyStreakCount: number;
  interactionStreakCount: number;
}

export async function recordPlatformInteraction(userId: string): Promise<void> {
  if (!userId || !db) return;

  const userProfileDocRef = doc(db, 'users', userId, 'userProfile', 'profile');
  const todayDateString = format(new Date(), 'yyyy-MM-dd');

  try {
    const docSnap = await getDoc(userProfileDocRef);
    let currentProfileData: Partial<UserProfileData> = {};

    if (docSnap.exists()) {
      currentProfileData = docSnap.data() as UserProfileData;
    }

    let lastInteractionDates = currentProfileData.lastInteractionDates || [];

    if (!lastInteractionDates.includes(todayDateString)) {
      lastInteractionDates.push(todayDateString);
      // Sort dates descending (most recent first) and keep unique
      lastInteractionDates = [...new Set(lastInteractionDates)].sort((a, b) => b.localeCompare(a));
      // Trim to keep only the most recent N dates
      if (lastInteractionDates.length > MAX_INTERACTION_DATES_STORED) {
        lastInteractionDates = lastInteractionDates.slice(0, MAX_INTERACTION_DATES_STORED);
      }

      if (docSnap.exists()) {
        await updateDoc(userProfileDocRef, { lastInteractionDates });
      } else {
        // If profile doesn't exist, create it with this interaction
        const initialProfile: UserProfileData = {
            coins: 0,
            xp: 0,
            earnedBadgeIds: [],
            purchasedItemIds: [],
            onboardingCompleted: false, // Or true if this interaction implies some onboarding
            lastInteractionDates,
            // Ensure other UserProfileData fields are initialized if necessary
            activeThemeId: currentProfileData.activeThemeId || null,
            dailyChallengeStatus: currentProfileData.dailyChallengeStatus || {},
            // Add other fields from UserProfileData with default values
            fullName: currentProfileData.fullName || '',
            targetExams: currentProfileData.targetExams || [],
            otherExamName: currentProfileData.otherExamName || '',
            examAttemptYear: currentProfileData.examAttemptYear || '',
            languageMedium: currentProfileData.languageMedium || '',
            studyMode: currentProfileData.studyMode || '',
            examPhase: currentProfileData.examPhase || '',
            previousAttempts: currentProfileData.previousAttempts || '',
            dailyStudyHours: currentProfileData.dailyStudyHours || '',
            preferredStudyTime: currentProfileData.preferredStudyTime || [],
            weakSubjects: currentProfileData.weakSubjects || [],
            strongSubjects: currentProfileData.strongSubjects || [],
            distractionStruggles: currentProfileData.distractionStruggles || '',
            preferredLearningStyles: currentProfileData.preferredLearningStyles || [],
            motivationType: currentProfileData.motivationType || '',
            age: currentProfileData.age === undefined ? null : currentProfileData.age,
            location: currentProfileData.location || '',
            socialVisibilityPublic: currentProfileData.socialVisibilityPublic || false,
        };
        await setDoc(userProfileDocRef, initialProfile);
      }
    }
  } catch (error) {
    console.error("Error recording platform interaction:", error);
    // Optionally, notify user or log to a more robust error tracking service
  }
}


function calculateConsecutiveInteractionDays(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;

  const uniqueSortedDates = [...new Set(dates)].map(d => parseISO(d)).sort((a, b) => b.getTime() - a.getTime());

  let consecutiveDays = 0;
  const today = new Date();

  // Check if today is one of the interaction dates
  if (uniqueSortedDates.some(date => differenceInCalendarDays(today, date) === 0)) {
    consecutiveDays = 1;
    // Check for consecutive days backwards from today
    for (let i = 1; i < 7; i++) { // Check up to 6 previous days for a total of 7
      const previousDayToFind = subDays(today, i);
      if (uniqueSortedDates.some(date => differenceInCalendarDays(previousDayToFind, date) === 0)) {
        consecutiveDays++;
      } else {
        break; // Streak broken
      }
    }
  }
  return Math.min(consecutiveDays, 7); // Cap at 7
}

export async function getUnlockAndProgressStatus(userId: string): Promise<UnlockStatus> {
  const progressTarget = 7;
  if (!userId || !db) {
    return {
      unlocked: false,
      displayProgress: 0,
      progressTarget,
      message: "Log in to track your progress!",
      unlockReason: 'none',
      studyStreakCount: 0,
      interactionStreakCount: 0,
    };
  }

  try {
    const userStreakDocRef = doc(db, 'users', userId, 'streaksData', 'main');
    const userProfileDocRef = doc(db, 'users', userId, 'userProfile', 'profile');

    const [streakSnap, profileSnap] = await Promise.all([
      getDoc(userStreakDocRef),
      getDoc(userProfileDocRef)
    ]);

    const streakDataFromDb = streakSnap.exists() ? streakSnap.data() as StreakData : { currentStreak: 0, longestStreak: 0, lastCheckInDate: null };
    const profileData = profileSnap.exists() ? profileSnap.data() as UserProfileData : { lastInteractionDates: [] };

    const currentStudyStreak = streakDataFromDb.currentStreak || 0;
    const studyStreakMet = currentStudyStreak >= progressTarget;

    const lastInteractionDates = profileData.lastInteractionDates || [];
    const interactionStreakCount = calculateConsecutiveInteractionDays(lastInteractionDates);
    const interactionStreakMet = interactionStreakCount >= progressTarget;

    const unlocked = studyStreakMet || interactionStreakMet;
    let displayProgress = 0;
    let message = "";
    let unlockReason: UnlockStatus['unlockReason'] = 'none';

    if (studyStreakMet && interactionStreakMet) {
      unlockReason = 'both';
      displayProgress = progressTarget;
      message = `You've unlocked it through both study and interaction streaks! (${progressTarget}/${progressTarget})`;
    } else if (studyStreakMet) {
      unlockReason = 'study_streak';
      displayProgress = progressTarget;
      message = `Unlocked via your awesome ${currentStudyStreak}-day study streak! (${progressTarget}/${progressTarget})`;
    } else if (interactionStreakMet) {
      unlockReason = 'interaction_streak';
      displayProgress = progressTarget;
      message = `Unlocked via your consistent ${interactionStreakCount}-day platform activity! (${progressTarget}/${progressTarget})`;
    } else {
      // Not unlocked yet, determine which progress to show
      if (currentStudyStreak > interactionStreakCount) {
        displayProgress = currentStudyStreak;
        message = `Current study streak: ${currentStudyStreak}/${progressTarget} days. Keep it up!`;
      } else if (interactionStreakCount > 0) {
        displayProgress = interactionStreakCount;
        message = `Daily platform interaction: ${interactionStreakCount}/${progressTarget} consecutive days.`;
      } else {
        displayProgress = 0;
        message = `Start a 7-day study or interaction streak to unlock! (0/${progressTarget})`;
      }
      displayProgress = Math.min(displayProgress, progressTarget); // Ensure progress doesn't exceed target
    }
    
    return {
      unlocked,
      displayProgress,
      progressTarget,
      message,
      unlockReason,
      studyStreakCount: currentStudyStreak,
      interactionStreakCount,
    };

  } catch (error) {
    console.error("Error getting unlock status:", error);
    return {
      unlocked: false, // Default to locked on error
      displayProgress: 0,
      progressTarget,
      message: "Could not retrieve progress. Please try again.",
      unlockReason: 'none',
      studyStreakCount: 0,
      interactionStreakCount: 0,
    };
  }
}

