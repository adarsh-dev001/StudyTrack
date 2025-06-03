
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CalendarDays, BrainCircuit, Loader2 } from 'lucide-react';
import DailyChallengesCard from '@/components/dashboard/DailyChallengesCard';
import DashboardMetricsCard from '@/components/dashboard/DashboardMetricsCard'; // New import
import TaskOverviewWidget from '@/components/dashboard/TaskOverviewWidget'; // New import
import type { StreakData } from '@/lib/profile-types';
import { motion } from 'framer-motion';

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
              <DailyChallengesCard />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <TaskOverviewWidget />
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
