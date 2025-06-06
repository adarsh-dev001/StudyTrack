
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, BookOpen, Zap, Target, Coffee, Sunrise, Brain, Loader2 } from 'lucide-react'; // Changed TargetIcon to Target
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, Timestamp, runTransaction, getDoc } from 'firebase/firestore';
import { isToday, startOfDay } from 'date-fns';
import type { UserProfileData } from '@/lib/profile-types';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { recordPlatformInteraction } from '@/lib/activity-utils';

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  goalValue: number; // e.g., number of pomodoros, tasks, or minutes
  rewardXP: number;
  rewardCoins: number;
  // Future: type: 'pomodoro' | 'task' | 'study_time' for automatic progress tracking
}

interface ActiveChallenge extends ChallengeDefinition {
  currentProgress: number; // For now, this will be 0 or goalValue upon manual completion
  isCompletedToday: boolean;
}

// Define a larger pool of challenges
const ALL_CHALLENGE_DEFINITIONS: ChallengeDefinition[] = [
  {
    id: 'daily_task_1',
    title: 'Early Bird Task',
    description: 'Complete 1 study task from your list before 12 PM.',
    icon: Sunrise,
    goalValue: 1,
    rewardXP: 10,
    rewardCoins: 5,
  },
  {
    id: 'daily_pomodoro_1',
    title: 'Focus Burst',
    description: 'Complete one 25-minute Pomodoro session.',
    icon: Brain,
    goalValue: 1,
    rewardXP: 15,
    rewardCoins: 5,
  },
  {
    id: 'daily_read_1',
    title: 'Quick Read',
    description: 'Read a chapter or an article related to your studies.',
    icon: BookOpen,
    goalValue: 1,
    rewardXP: 10,
    rewardCoins: 3,
  },
  {
    id: 'daily_review_1',
    title: 'Swift Review',
    description: 'Briefly review notes for one subject for 15 minutes.',
    icon: Zap,
    goalValue: 1,
    rewardXP: 10,
    rewardCoins: 3,
  },
  {
    id: 'daily_plan_day',
    title: 'Plan Your Day',
    description: 'Add at least 2 tasks to your study planner for today.',
    icon: Target, // Using Target directly
    goalValue: 1, // Representing the act of planning
    rewardXP: 5,
    rewardCoins: 2,
  },
  {
    id: 'daily_hydrate_break',
    title: 'Hydration Break',
    description: 'Take a 5-minute break and drink a glass of water.',
    icon: Coffee, // Placeholder, consider WaterDrop or similar
    goalValue: 1,
    rewardXP: 5,
    rewardCoins: 1,
  },
];

interface ChallengeDisplayItemProps {
  challenge: ActiveChallenge;
  onCompleteChallenge: (challengeId: string) => Promise<void>;
  isCompleting: boolean;
}

const ChallengeDisplayItem = React.memo(function ChallengeDisplayItem({
  challenge,
  onCompleteChallenge,
  isCompleting,
}: ChallengeDisplayItemProps) {
  const IconComponent = challenge.icon;
  return (
    <div className="p-3 sm:p-4 border rounded-lg bg-card/40 shadow-sm space-y-2 sm:space-y-3">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="bg-primary/10 p-1.5 sm:p-2 rounded-md mt-0.5 sm:mt-1">
          <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-sm sm:text-md text-foreground">{challenge.title}</h4>
          <p className="text-xs text-muted-foreground">{challenge.description}</p>
        </div>
      </div>
      
      <div className="space-y-1 sm:space-y-1.5">
        <div className="flex justify-between items-center text-xs mb-0.5 sm:mb-1">
          <span className="text-muted-foreground">Progress:</span>
          <span className="font-medium text-foreground">{challenge.isCompletedToday ? challenge.goalValue : challenge.currentProgress} / {challenge.goalValue}</span>
        </div>
        <Progress value={((challenge.isCompletedToday ? challenge.goalValue : challenge.currentProgress) / challenge.goalValue) * 100} className="h-2 sm:h-2.5" />
      </div>

      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1.5 sm:gap-2 pt-1.5 sm:pt-2">
          <div className="text-xs sm:text-sm">
              <span className="font-semibold text-green-600 dark:text-green-400">+{challenge.rewardXP} XP</span>
              <span className="text-muted-foreground mx-1">|</span>
              <span className="font-semibold text-yellow-500 dark:text-yellow-400">+{challenge.rewardCoins} 🪙</span>
          </div>
          <Button
              onClick={() => onCompleteChallenge(challenge.id)}
              disabled={challenge.isCompletedToday || isCompleting}
              size="sm"
              variant={challenge.isCompletedToday ? "secondary" : "default"}
              className="w-full xs:w-auto text-xs sm:text-sm h-8 sm:h-9"
          >
              {isCompleting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> :
               challenge.isCompletedToday ? (
                  <><CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Claimed Today!</>
              ) : (
                  <><Award className="mr-1.5 h-3.5 w-3.5" /> Complete Challenge</>
              )}
          </Button>
      </div>
    </div>
  );
});


export default function DailyChallengesCard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [completingChallengeId, setCompletingChallengeId] = useState<string | null>(null);

  const selectChallengesForToday = useCallback(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const numChallengesToSelect = ALL_CHALLENGE_DEFINITIONS.length >= 2 ? 2 : ALL_CHALLENGE_DEFINITIONS.length;
    const selectedIndexes = new Set<number>();
    
    if (ALL_CHALLENGE_DEFINITIONS.length === 0) return [];

    for (let i = 0; i < numChallengesToSelect; i++) {
      selectedIndexes.add((dayOfYear + i) % ALL_CHALLENGE_DEFINITIONS.length);
    }
    let attempt = 0;
    while(selectedIndexes.size < numChallengesToSelect && attempt < ALL_CHALLENGE_DEFINITIONS.length) {
        selectedIndexes.add((dayOfYear + numChallengesToSelect + attempt) % ALL_CHALLENGE_DEFINITIONS.length);
        attempt++;
    }

    return Array.from(selectedIndexes).map(index => ALL_CHALLENGE_DEFINITIONS[index]);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingChallenges(false);
      setActiveChallenges([]);
      return;
    }

    setLoadingChallenges(true);
    const todaySelectedDefs = selectChallengesForToday();
    if (todaySelectedDefs.length === 0) {
        setActiveChallenges([]);
        setLoadingChallenges(false);
        return;
    }

    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');

    getDoc(userProfileDocRef).then(docSnap => {
      const profileData = docSnap.exists() ? docSnap.data() as UserProfileData : undefined;
      const challengeStatus = profileData?.dailyChallengeStatus || {};

      const challengesToDisplay = todaySelectedDefs.map(challengeDef => {
        const status = challengeStatus[challengeDef.id];
        let isCompletedToday = false;
        if (status && status.completedOn instanceof Timestamp) {
          isCompletedToday = isToday(status.completedOn.toDate());
        }
        return {
          ...challengeDef,
          currentProgress: isCompletedToday ? challengeDef.goalValue : 0,
          isCompletedToday: isCompletedToday,
        };
      });
      setActiveChallenges(challengesToDisplay);
      setLoadingChallenges(false);
    }).catch(error => {
      console.error("Error fetching challenge status:", error);
      toast({ title: "Error", description: "Could not load challenge status.", variant: "destructive" });
      setActiveChallenges(todaySelectedDefs.map(def => ({...def, currentProgress: 0, isCompletedToday: false })));
      setLoadingChallenges(false);
    });

  }, [currentUser?.uid, toast, selectChallengesForToday]);


  const handleCompleteChallenge = useCallback(async (challengeId: string) => {
    if (!currentUser?.uid || !db) {
      toast({ title: 'Login Required', description: 'Please log in to complete challenges.', variant: 'destructive' });
      return;
    }

    const challengeToComplete = activeChallenges.find(c => c.id === challengeId);
    if (!challengeToComplete || challengeToComplete.isCompletedToday) return;

    setCompletingChallengeId(challengeId);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');

    try {
      await runTransaction(db, async (transaction) => {
        const profileDoc = await transaction.get(userProfileDocRef);
        
        const currentData = profileDoc.exists() ? profileDoc.data() as UserProfileData : undefined;
        
        const currentCoins = currentData?.coins || 0;
        const currentXP = currentData?.xp || 0;
        const currentChallengeStatus = currentData?.dailyChallengeStatus || {};
        const currentEarnedBadgeIds = currentData?.earnedBadgeIds || [];
        const currentPurchasedItemIds = currentData?.purchasedItemIds || [];
        const currentActiveThemeId = currentData?.activeThemeId === undefined ? DEFAULT_THEME_ID : currentData.activeThemeId;
        const currentLastInteractionDates = currentData?.lastInteractionDates || [];


        const existingStatus = (currentChallengeStatus as any)[challengeId];
        if (existingStatus && existingStatus.completedOn instanceof Timestamp && isToday(existingStatus.completedOn.toDate())) {
            setActiveChallenges(prev => prev.map(c => c.id === challengeId ? {...c, isCompletedToday: true, currentProgress: c.goalValue } : c));
            toast({ title: 'Already Done!', description: 'You already completed this challenge today.', variant: 'default' });
            setCompletingChallengeId(null);
            return; 
        }

        const newCoins = currentCoins + challengeToComplete.rewardCoins;
        const newXP = currentXP + challengeToComplete.rewardXP;
        const updatedChallengeStatus = {
          ...(currentChallengeStatus as any),
          [challengeId]: { completedOn: Timestamp.fromDate(startOfDay(new Date())) }
        };

        const profilePayload: UserProfileData = {
            coins: newCoins,
            xp: newXP,
            dailyChallengeStatus: updatedChallengeStatus,
            earnedBadgeIds: currentEarnedBadgeIds,
            purchasedItemIds: currentPurchasedItemIds,
            activeThemeId: currentActiveThemeId,
            onboardingCompleted: currentData?.onboardingCompleted || false, 
            lastInteractionDates: currentLastInteractionDates, 
        };

        if (profileDoc.exists()) {
            transaction.update(userProfileDocRef, profilePayload);
        } else {
            transaction.set(userProfileDocRef, profilePayload);
        }
      });

      setActiveChallenges(prevChallenges =>
        prevChallenges.map(challenge =>
          challenge.id === challengeId
            ? { ...challenge, currentProgress: challenge.goalValue, isCompletedToday: true }
            : challenge
        )
      );

      toast({
        title: 'Challenge Complete! 🎉',
        description: `You earned +${challengeToComplete.rewardXP} XP and +${challengeToComplete.rewardCoins} Coins! 🪙`,
      });

      await recordPlatformInteraction(currentUser.uid);

    } catch (error: any) {
      console.error('Error completing challenge:', error);
      toast({
        title: 'Challenge Completion Failed 😥',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setCompletingChallengeId(null);
    }
  }, [currentUser?.uid, db, toast, activeChallenges]); // Added activeChallenges and db to dependencies

  if (loadingChallenges) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center"><Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" /> Daily Challenges</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Loading today's challenges...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
            {[1, 2].map(i => (
                <div key={i} className="p-3 sm:p-4 border rounded-lg bg-card/40 shadow-sm space-y-2 sm:space-y-3">
                <div className="flex items-start gap-2 sm:gap-3">
                    <div className="bg-muted p-1.5 sm:p-2 rounded-md mt-0.5 sm:mt-1 animate-pulse h-8 w-8 sm:h-10 sm:w-10"></div>
                    <div className="w-full">
                    <div className="h-4 sm:h-5 w-3/4 bg-muted rounded animate-pulse mb-1 sm:mb-1.5"></div>
                    <div className="h-2.5 sm:h-3 w-full bg-muted rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="h-2 sm:h-2.5 w-full bg-muted rounded animate-pulse mt-1.5 sm:mt-2"></div>
                <div className="h-7 sm:h-8 w-1/3 bg-muted rounded animate-pulse mt-2 sm:mt-3 ml-auto"></div>
                </div>
            ))}
            </CardContent>
        </Card>
    );
  }


  if (activeChallenges.length === 0 && !loadingChallenges) {
    return (
        <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-semibold flex items-center"><Target className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Daily Challenges</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Check back later for new challenges!</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
                <p className="text-muted-foreground text-sm">No challenges available right now. Keep up the great work! 💪</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
          <Target className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Daily Challenges
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">Complete today's challenges for bonus XP and Coins!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {activeChallenges.map(challenge => (
          <ChallengeDisplayItem
            key={challenge.id}
            challenge={challenge}
            onCompleteChallenge={handleCompleteChallenge}
            isCompleting={completingChallengeId === challenge.id}
          />
        ))}
      </CardContent>
    </Card>
  );
}
