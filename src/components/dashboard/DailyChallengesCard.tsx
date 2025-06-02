
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Award, CheckCircle, BookOpen, Zap, Target as TargetIcon, Coffee, Sunrise, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  goalValue: number;
  currentProgress: number; // User's current progress
  rewardXP: number;
  rewardCoins: number;
  isCompleted: boolean;
}

const ALL_CHALLENGES: Omit<Challenge, 'currentProgress' | 'isCompleted'>[] = [
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
  const { toast } = useToast();
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    // Simple logic to "rotate" challenges based on the day of the year
    // This is a placeholder for a more robust challenge selection system.
    // We'll select two challenges.
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    const selectedIndexes = [
      dayOfYear % ALL_CHALLENGES.length,
      (dayOfYear + 1) % ALL_CHALLENGES.length,
    ];
    // Ensure unique challenges if possible
    if (selectedIndexes[0] === selectedIndexes[1] && ALL_CHALLENGES.length > 1) {
        selectedIndexes[1] = (selectedIndexes[1] + 1) % ALL_CHALLENGES.length;
    }
    
    const challengesForToday = Array.from(new Set(selectedIndexes)).map(index => {
      const challengeDef = ALL_CHALLENGES[index];
      // In a real app, 'currentProgress' and 'isCompleted' would be loaded from user's saved state.
      // For now, they reset on each load.
      return {
        ...challengeDef,
        currentProgress: 0, 
        isCompleted: false,
      };
    });
    setActiveChallenges(challengesForToday);
  }, []);

  const handleCompleteChallenge = (challengeId: string) => {
    setActiveChallenges(prevChallenges =>
      prevChallenges.map(challenge => {
        if (challenge.id === challengeId && !challenge.isCompleted) {
          toast({
            title: 'Challenge Complete! 🎉',
            description: `You earned +${challenge.rewardXP} XP and +${challenge.rewardCoins} Coins! 🪙 (Rewards are illustrative for now)`,
          });
          return { ...challenge, currentProgress: challenge.goalValue, isCompleted: true };
        }
        return challenge;
      })
    );
    // Future: Call a function here to update user's XP and Coins in Firestore.
  };

  if (activeChallenges.length === 0) {
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
        <CardDescription>Complete today's challenges for bonus rewards! (Rewards are illustrative for now)</CardDescription>
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
                <span className="font-medium text-foreground">{challenge.currentProgress} / {challenge.goalValue}</span>
              </div>
              <Progress value={(challenge.currentProgress / challenge.goalValue) * 100} className="h-2.5" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                <div className="text-sm">
                    <span className="font-semibold text-green-600 dark:text-green-400">+{challenge.rewardXP} XP</span>
                    <span className="text-muted-foreground mx-1">|</span>
                    <span className="font-semibold text-yellow-500 dark:text-yellow-400">+{challenge.rewardCoins} 🪙</span>
                </div>
                <Button
                    onClick={() => handleCompleteChallenge(challenge.id)}
                    disabled={challenge.isCompleted}
                    size="sm"
                    variant={challenge.isCompleted ? "secondary" : "default"}
                    className="w-full sm:w-auto"
                >
                    {challenge.isCompleted ? (
                        <><CheckCircle className="mr-2 h-4 w-4" /> Claimed!</>
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
