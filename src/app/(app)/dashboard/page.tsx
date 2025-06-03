
'use client';

import React, { useState, useEffect } from 'react'; // Removed Suspense
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CalendarDays, BrainCircuit, Loader2 } from 'lucide-react';
import DailyChallengesCard from '@/components/dashboard/DailyChallengesCard'; // Direct import

interface StreakData {
  currentStreak: number;
  lastCheckInDate: Timestamp | null;
}

// Fallback function is no longer needed with direct import
// function DailyChallengesFallback() { ... }


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
        // Removed Suspense and DailyChallengesFallback wrapper
        <DailyChallengesCard />
      )}

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
    </div>
  );
}
