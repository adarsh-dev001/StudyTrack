
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, ListChecks, CalendarDays, ArrowRight, User, Loader2, BrainCircuit } from 'lucide-react'; // Added BrainCircuit
import type { Task } from '@/components/tasks/task-item'; // Assuming Task type is exported
import DailyChallengesCard from '@/components/dashboard/DailyChallengesCard'; // Import the new component

interface StreakData {
  currentStreak: number;
  lastCheckInDate: Timestamp | null;
}

function DailyChallengesFallback() {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center">
            <Loader2 className="mr-3 h-6 w-6 animate-spin text-primary" /> Daily Challenges
          </CardTitle>
          <CardDescription>Loading today's challenges...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="p-4 border rounded-lg bg-card/40 shadow-sm space-y-3">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md mt-1 animate-pulse">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
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


export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [loadingStreak, setLoadingStreak] = useState(true);

  // Fetch Study Streak
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

  // Fetch Task Count from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTasks = localStorage.getItem('studyTrackTasks');
      if (savedTasks) {
        const tasks: Task[] = JSON.parse(savedTasks);
        const pending = tasks.filter(task => !task.completed).length;
        setPendingTasksCount(pending);
      }
    }
  }, []);

  const welcomeName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Welcome back, {welcomeName}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Here&apos;s your study overview. Keep up the great work!
        </p>
      </div>
      
      {/* Daily Challenges Card - Placed near the top for visibility */}
      {currentUser && (
        <Suspense fallback={<DailyChallengesFallback />}>
            <DailyChallengesCard />
        </Suspense>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Current Streak Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Current Streak</CardTitle>
            <Flame className="h-6 w-6 text-orange-500" />
          </CardHeader>
          <CardContent>
            {authLoading || loadingStreak ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading streak...</p>
              </div>
            ) : currentUser && streakData ? (
              <>
                <div className="text-4xl font-bold text-orange-500">
                  {streakData.currentStreak}
                </div>
                <p className="text-xs text-muted-foreground">
                  {streakData.currentStreak === 1 ? 'day' : 'days'} of consistent study
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Login to see your streak.</p>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/streaks">
                View Streaks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pending Tasks Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Pending Tasks</CardTitle>
            <ListChecks className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {pendingTasksCount}
            </div>
            <p className="text-xs text-muted-foreground">
              tasks awaiting completion
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks">
                Manage Tasks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Study Planner Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300_transform hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Study Planner</CardTitle>
            <CalendarDays className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">
              Plan
            </div>
            <p className="text-xs text-muted-foreground">
              Organize your upcoming study sessions.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/study-planner">
                Open Planner <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
            <CardDescription>Jump right into your study tools.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Button variant="default" size="lg" asChild className="w-full">
                <Link href="/study-planner">
                    <CalendarDays className="mr-2 h-5 w-5" /> Go to Planner
                </Link>
            </Button>
            <Button variant="default" size="lg" asChild className="w-full">
                <Link href="/tasks#addTask"> 
                    <ListChecks className="mr-2 h-5 w-5" /> Add New Task
                </Link>
            </Button>
             <Button variant="default" size="lg" asChild className="w-full">
                <Link href="/ai-tools">
                    <BrainCircuit className="mr-2 h-5 w-5" /> Explore AI Tools {/* Changed icon */}
                </Link>
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
