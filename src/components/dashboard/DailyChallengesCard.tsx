
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, BookOpen, Zap, Target as TargetIcon, Coffee, Sunrise, Brain, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, Timestamp, runTransaction, getDoc } from 'firebase/firestore';
import { isToday, startOfDay } from 'date-fns';

interface ChallengeDefinition {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  goalValue: number;
  rewardXP: number;
  rewardCoins: number;
  // currentProgress and isCompleted will be managed in active state
}

interface ActiveChallenge extends ChallengeDefinition {
  currentProgress: number;
  isCompletedToday: boolean;
}

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
  }
];

export default function DailyChallengesCard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [completingChallengeId, setCompletingChallengeId] = useState<string | null>(null);

  const selectChallengesForToday = useCallback(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const selectedIndexes = [
      dayOfYear % ALL_CHALLENGE_DEFINITIONS.length,
      (dayOfYear + 1) % ALL_CHALLENGE_DEFINITIONS.length,
    ];
    if (selectedIndexes[0] === selectedIndexes[1] && ALL_CHALLENGE_DEFINITIONS.length > 1) {
      selectedIndexes[1] = (selectedIndexes[1] + 1) % ALL_CHALLENGE_DEFINITIONS.length;
    }
    return Array.from(new Set(selectedIndexes)).map(index => ALL_CHALLENGE_DEFINITIONS[index]);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingChallenges(false);
      setActiveChallenges([]);
      return;
    }

    setLoadingChallenges(true);
    const todaySelectedDefs = selectChallengesForToday();
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');

    getDoc(userProfileDocRef).then(docSnap => {
      const profileData = docSnap.exists() ? docSnap.data() : {};
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


  const handleCompleteChallenge = async (challengeId: string) => {
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
        if (!profileDoc.exists()) {
          // Create profile if it doesn't exist, then retry or handle error
          // For simplicity, we'll assume profile is usually created by streaks page or first coin earn
          throw new Error("User profile not found. Please visit the Streaks page first.");
        }

        const currentData = profileDoc.data();
        const currentCoins = currentData.coins || 0;
        const currentXP = currentData.xp || 0;
        const currentChallengeStatus = currentData.dailyChallengeStatus || {};

        // Check again inside transaction if already completed today
        const existingStatus = currentChallengeStatus[challengeId];
        if (existingStatus && existingStatus.completedOn instanceof Timestamp && isToday(existingStatus.completedOn.toDate())) {
            // Already completed by another means or race condition
            setActiveChallenges(prev => prev.map(c => c.id === challengeId ? {...c, isCompletedToday: true, currentProgress: c.goalValue } : c));
            toast({ title: 'Already Done!', description: 'You already completed this challenge today.', variant: 'default' });
            return; // Exit transaction
        }


        const newCoins = currentCoins + challengeToComplete.rewardCoins;
        const newXP = currentXP + challengeToComplete.rewardXP;
        const newChallengeStatus = {
          ...currentChallengeStatus,
          [challengeId]: { completedOn: Timestamp.fromDate(startOfDay(new Date())) } // Store start of day for easier daily checks
        };

        transaction.update(userProfileDocRef, {
          coins: newCoins,
          xp: newXP,
          dailyChallengeStatus: newChallengeStatus
        });
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
  };

  if (loadingChallenges) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center"><Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" /> Daily Challenges</CardTitle>
                <CardDescription>Loading today's challenges...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {[1, 2].map(i => (
                <div key={i} className="p-4 border rounded-lg bg-card/40 shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-md mt-1 animate-pulse h-10 w-10"></div>
                    <div className="w-full">
                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-1.5"></div>
                    <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="h-2.5 w-full bg-muted rounded animate-pulse mt-2"></div>
                <div className="h-8 w-1/3 bg-muted rounded animate-pulse mt-3 ml-auto"></div>
                </div>
            ))}
            </CardContent>
        </Card>
    );
  }


  if (activeChallenges.length === 0 && !loadingChallenges) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center"><TargetIcon className="mr-3 h-6 w-6 text-primary" /> Daily Challenges</CardTitle>
                <CardDescription>Check back later for new challenges!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">No challenges available right now. Keep up the great work! 💪</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <TargetIcon className="mr-3 h-6 w-6 text-primary" /> Daily Challenges
        </CardTitle>
        <CardDescription>Complete today's challenges for bonus XP and Coins!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeChallenges.map(challenge => (
          <div key={challenge.id} className="p-4 border rounded-lg bg-card/40 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-md mt-1">
                <challenge.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-md text-foreground">{challenge.title}</h4>
                <p className="text-xs text-muted-foreground">{challenge.description}</p>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium text-foreground">{challenge.isCompletedToday ? challenge.goalValue : challenge.currentProgress} / {challenge.goalValue}</span>
              </div>
              <Progress value={( (challenge.isCompletedToday ? challenge.goalValue : challenge.currentProgress) / challenge.goalValue) * 100} className="h-2.5" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <div className="text-sm">
                    <span className="font-semibold text-green-600 dark:text-green-400">+{challenge.rewardXP} XP</span>
                    <span className="text-muted-foreground mx-1">|</span>
                    <span className="font-semibold text-yellow-500 dark:text-yellow-400">+{challenge.rewardCoins} 🪙</span>
                </div>
                <Button
                    onClick={() => handleCompleteChallenge(challenge.id)}
                    disabled={challenge.isCompletedToday || completingChallengeId === challenge.id}
                    size="sm"
                    variant={challenge.isCompletedToday ? "secondary" : "default"}
                    className="w-full sm:w-auto"
                >
                    {completingChallengeId === challenge.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> :
                     challenge.isCompletedToday ? (
                        <><CheckCircle className="mr-2 h-4 w-4" /> Claimed Today!</>
                    ) : (
                        <><Award className="mr-2 h-4 w-4" /> Complete Challenge</>
                    )}
                </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

    