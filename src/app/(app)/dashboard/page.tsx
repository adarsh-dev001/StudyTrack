
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, ListChecks, CalendarDays, ArrowRight, User, Loader2, BrainCircuit, Target as TargetIcon } from 'lucide-react'; // Added TargetIcon
import type { Task } from '@/components/tasks/task-item'; // This might not be needed directly anymore
import DailyChallengesCard from '@/components/dashboard/DailyChallengesCard'; // Import the new component

interface StreakData {
  currentStreak: number;
  lastCheckInDate: Timestamp | null;
}

// Fallback for DailyChallengesCard during lazy loading
function DailyChallengesFallback() {
    return (
      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
            <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" /> Daily Challenges
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Loading today's challenges...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          {[1, 2].map(i => (
            <div key={i} className="p-3 sm:p-4 border rounded-lg bg-card/40 shadow-sm space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="bg-muted p-1.5 sm:p-2 rounded-md mt-0.5 sm:mt-1 animate-pulse h-8 w-8">
                  {/* Placeholder for icon */}
                </div>
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


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingStreak(false);
      setStreakData(null);
      return;
    }

    setLoadingStreak(true);
    const userStreakDocRef = doc(db, 'users', currentUser.uid, 'streaksData', 'main');
    const unsubscribe = onSnapshot(
      userStreakDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StreakData;
          setStreakData(data);
        } else {
          // If no streak data, initialize with 0, but don't set lastCheckInDate
          // as that implies a check-in. The StreaksPage handles creating this doc.
          setStreakData({ currentStreak: 0, lastCheckInDate: null });
        }
        setLoadingStreak(false);
      },
      (error) => {
        console.error('Error fetching streak data for dashboard:', error);
        setStreakData(null);
        setLoadingStreak(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const welcomeName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const currentStreakDisplay = authLoading || loadingStreak ? '...' : (streakData?.currentStreak ?? 0);

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
          👋 Welcome back, {welcomeName}!
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          {authLoading || loadingStreak ? (
            <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" /> 
          ) : (
            `Ready to conquer Day ${currentStreakDisplay} of your streak? Let's make today productive! 🚀`
          )}
        </p>
      </div>
      
      {currentUser && (
        <Suspense fallback={<DailyChallengesFallback />}>
            <DailyChallengesCard />
        </Suspense>
      )}

      {/* Other existing cards like "Quick Actions" can remain or be adjusted */}
      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Jump right into your study tools.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6">
            <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                <Link href="/study-planner">
                    <CalendarDays className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Go to Planner
                </Link>
            </Button>
            <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                <Link href="/tasks#addTask"> 
                    <ListChecks className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Task
                </Link>
            </Button>
             <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                <Link href="/ai-tools">
                    <BrainCircuit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Explore AI Tools
                </Link>
            </Button>
        </CardContent>
      </Card>

      {/* Placeholder for future widgets like Today's Plan, Progress Tracker, etc. */}
      {/* 
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
         Placeholder for Today's Plan
        <Card>
            <CardHeader><CardTitle>Today's Plan</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Upcoming sessions will appear here.</p></CardContent>
        </Card>
         Placeholder for Progress Tracker 
        <Card>
            <CardHeader><CardTitle>Progress Tracker</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Subject progress will be shown here.</p></CardContent>
        </Card>
      </div> 
      */}

    </div>
  );
}
