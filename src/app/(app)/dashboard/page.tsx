
'use client';

import React, { useState, useEffect, Suspense } from 'react'; // Added Suspense
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CalendarDays, BrainCircuit, Loader2 } from 'lucide-react';
import DashboardMetricsCard from '@/components/dashboard/DashboardMetricsCard';
import type { StreakData } from '@/lib/profile-types';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton

// Lazy load components
const DailyChallengesCard = React.lazy(() => import('@/components/dashboard/DailyChallengesCard'));
const TaskOverviewWidget = React.lazy(() => import('@/components/dashboard/TaskOverviewWidget'));

// Fallback Skeletons
function DailyChallengesCardFallback() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        {[1, 2].map(i => (
          <div key={i} className="p-3 sm:p-4 border rounded-lg bg-card/40 shadow-sm space-y-2">
            <div className="flex items-start gap-2">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-md" />
              <div className="w-full">
                <Skeleton className="h-4 sm:h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-full" />
              </div>
            </div>
            <Skeleton className="h-2 sm:h-2.5 w-full mt-1" />
            <Skeleton className="h-7 sm:h-8 w-1/3 ml-auto mt-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TaskOverviewWidgetFallback() {
  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="space-y-2 px-4 pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-2.5 rounded-md border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div className="flex-grow">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-12 self-start sm:self-center" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
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
          setStreakData({ currentStreak: 0, longestStreak: 0, lastCheckInDate: null });
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
      <motion.div 
        className="space-y-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.div>
      
      {currentUser && (
        <>
          <DashboardMetricsCard streakData={streakData} loadingStreak={loadingStreak} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Suspense fallback={<DailyChallengesCardFallback />}>
                <DailyChallengesCard />
              </Suspense>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Suspense fallback={<TaskOverviewWidgetFallback />}>
                <TaskOverviewWidget />
              </Suspense>
            </motion.div>
          </div>
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
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
      </motion.div>
    </div>
  );
}
