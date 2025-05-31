
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Loader2, CalendarCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday, startOfDay, differenceInCalendarDays } from 'date-fns';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Timestamp | null;
}

const initialStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
};

export default function StreaksPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);

  const streakDocRef = currentUser ? doc(db, 'users', currentUser.uid, 'streaksData', 'main') : null;

  useEffect(() => {
    if (!currentUser || !streakDocRef) {
      setLoading(false);
      setStreakData(null); // Reset if user logs out
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      streakDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StreakData;
          setStreakData(data);
          if (data.lastCheckInDate) {
            setAlreadyCheckedInToday(isToday(data.lastCheckInDate.toDate()));
          } else {
            setAlreadyCheckedInToday(false);
          }
        } else {
          // Initialize streak data if it doesn't exist
          setStreakData(initialStreakData);
          setAlreadyCheckedInToday(false);
          // Optionally, create the initial document here or let check-in handle it
          // setDoc(streakDocRef, initialStreakData);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching streak data:', error);
        toast({
          title: 'Error',
          description: 'Could not load streak data.',
          variant: 'destructive',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, streakDocRef, toast]);

  const handleCheckIn = useCallback(async () => {
    if (!currentUser || !streakDocRef) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    if (alreadyCheckedInToday) {
      toast({ title: 'Already Checked In', description: 'You have already checked in for today!' });
      return;
    }

    setIsCheckingIn(true);
    try {
      const today = new Date();
      const todayTimestamp = Timestamp.fromDate(today);
      
      let newCurrentStreak = 1;
      let newLongestStreak = streakData?.longestStreak || 0;

      const docSnap = await getDoc(streakDocRef);
      let currentData = initialStreakData;

      if (docSnap.exists()) {
        currentData = docSnap.data() as StreakData;
      }
      
      if (currentData.lastCheckInDate) {
        const lastCheckIn = currentData.lastCheckInDate.toDate();
        if (isYesterday(lastCheckIn)) {
          newCurrentStreak = (currentData.currentStreak || 0) + 1;
        } else if (isToday(lastCheckIn)) {
          // This case should be caught by alreadyCheckedInToday, but as a safeguard:
          toast({ title: 'Already Checked In', description: 'You have already checked in today.' });
          setIsCheckingIn(false);
          return;
        }
        // If last check-in was before yesterday, streak resets to 1 (already handled by newCurrentStreak = 1)
      }

      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      const updatedData: StreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: todayTimestamp,
      };

      await setDoc(streakDocRef, updatedData, { merge: true }); // Use setDoc with merge for robust creation/update
      
      setStreakData(updatedData); // Optimistic update for UI
      setAlreadyCheckedInToday(true); // Optimistic update

      toast({
        title: 'Checked In!',
        description: `Your current streak is ${newCurrentStreak} ${newCurrentStreak === 1 ? 'day' : 'days'}. Keep it up!`,
      });
    } catch (error) {
      console.error('Error during check-in:', error);
      toast({
        title: 'Check-in Failed',
        description: 'Could not process your check-in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckingIn(false);
    }
  }, [currentUser, streakDocRef, streakData, toast, alreadyCheckedInToday]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Study Streaks</h1>
        <p className="text-lg text-muted-foreground">Log in to track your daily study consistency.</p>
         <Card className="shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to view and manage your study streaks.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentStreakValue = streakData?.currentStreak || 0;
  const longestStreakValue = streakData?.longestStreak || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Study Streaks</h1>
        <p className="text-lg text-muted-foreground">Track your daily study consistency and build strong habits!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-xl transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Current Streak</CardTitle>
            <Flame className="h-8 w-8 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-orange-500">{currentStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">
              {currentStreakValue === 1 ? 'day' : 'days'} of consistent study
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Longest Streak</CardTitle>
            <Flame className="h-8 w-8 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">{longestStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">
              Your personal best!
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Daily Check-in</CardTitle>
          <CardDescription>
            {alreadyCheckedInToday 
              ? "You've already checked in for today. Great job!" 
              : "Check in now to maintain your streak!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCheckIn} 
            disabled={alreadyCheckedInToday || isCheckingIn}
            className="w-full text-lg py-6"
            size="lg"
          >
            {isCheckingIn ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : alreadyCheckedInToday ? (
              <CalendarCheck2 className="mr-2 h-5 w-5" />
            ) : (
              <Flame className="mr-2 h-5 w-5" />
            )}
            {isCheckingIn 
              ? 'Checking In...' 
              : alreadyCheckedInToday 
              ? 'Checked In for Today!' 
              : 'Check-in for Today'}
          </Button>
          {streakData?.lastCheckInDate && (
             <p className="text-sm text-muted-foreground mt-3 text-center">
                Last check-in: {streakData.lastCheckInDate.toDate().toLocaleDateString()}
             </p>
          )}
        </CardContent>
      </Card>
       <div className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-xl font-semibold mb-3">Why Track Streaks?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Builds a powerful habit of daily studying.</li>
            <li>Provides motivation to stay consistent.</li>
            <li>Visualizes your commitment and progress over time.</li>
            <li>Helps in identifying patterns and overcoming procrastination.</li>
          </ul>
        </div>
    </div>
  );
}
