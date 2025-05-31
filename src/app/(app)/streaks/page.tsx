
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Loader2, CalendarCheck2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday } from 'date-fns';

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
  const [streakData, setStreakData] = useState<StreakData>(initialStreakData);
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Clear previous listener if it exists
    if (unsubscribeRef.current) {
      console.log('StreaksPage: Unsubscribing previous listener on effect re-run or unmount.');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  
    if (!currentUser?.uid || !db) {
      console.log('StreaksPage: No current user or db instance. Resetting state and skipping listener setup.');
      setLoading(false);
      setStreakData(initialStreakData);
      setAlreadyCheckedInToday(false);
      return; 
    }
  
    setLoading(true); // Set loading true when we start fetching or listening.
    console.log(`StreaksPage: Setting up snapshot listener for user ${currentUser.uid}`);
    
    const userStreakDocRef = doc(db, 'users', currentUser.uid, 'streaksData', 'main');
  
    unsubscribeRef.current = onSnapshot(
      userStreakDocRef,
      (docSnap) => {
        console.log('StreaksPage: onSnapshot triggered. Document exists:', docSnap.exists());
        if (docSnap.exists()) {
          const rawData = docSnap.data();
          const validatedData: StreakData = {
            currentStreak: typeof rawData.currentStreak === 'number' ? rawData.currentStreak : 0,
            longestStreak: typeof rawData.longestStreak === 'number' ? rawData.longestStreak : 0,
            lastCheckInDate: rawData.lastCheckInDate instanceof Timestamp ? rawData.lastCheckInDate : null,
          };
          setStreakData(validatedData);
          if (validatedData.lastCheckInDate) {
            setAlreadyCheckedInToday(isToday(validatedData.lastCheckInDate.toDate()));
          } else {
            setAlreadyCheckedInToday(false);
          }
          console.log('StreaksPage: Streak data updated from snapshot:', validatedData);
        } else {
          console.log('StreaksPage: Streak document does not exist. Using initial data.');
          setStreakData(initialStreakData);
          setAlreadyCheckedInToday(false);
          // Consider creating the document if it's crucial for it to exist.
          // For now, let check-in handle creation.
        }
        setLoading(false);
      },
      (error) => {
        console.error('StreaksPage: Error fetching streak data with onSnapshot:', error);
        toast({
          title: 'Error Loading Streaks',
          description: 'Could not load your streak data. Please try refreshing.',
          variant: 'destructive',
        });
        setLoading(false); // Ensure loading is false on error.
        setStreakData(initialStreakData); // Reset to initial on error to avoid showing stale/incorrect data.
        setAlreadyCheckedInToday(false);
      }
    );
    console.log('StreaksPage: Snapshot listener is now set up.');
  
    // Cleanup function for this effect
    return () => {
      if (unsubscribeRef.current) {
        console.log('StreaksPage: useEffect cleanup - unsubscribing current listener.');
        unsubscribeRef.current();
        unsubscribeRef.current = null; // Important to nullify after unsubscribing
      }
    };
  }, [currentUser?.uid, db, toast]); // db and toast are stable references, currentUser.uid ensures re-run only on user change.
  

  const handleCheckIn = useCallback(async () => {
    const currentUserId = currentUser?.uid; // Use a local const for stability if currentUser object changes
    if (!currentUserId || !db) {
      toast({ title: 'Error', description: 'You must be logged in to check in.', variant: 'destructive' });
      return;
    }
    
    // UI check based on current state
    if (streakData.lastCheckInDate && isToday(streakData.lastCheckInDate.toDate())) {
        toast({ title: 'Already Checked In', description: 'You have already checked in for today!' });
        return; // Avoid proceeding if already checked in based on current state
    }
    
    setIsCheckingIn(true);
    const userStreakDocRef = doc(db, 'users', currentUserId, 'streaksData', 'main');

    try {
      // Fetch the latest data before writing to avoid race conditions or stale data overwrites.
      const docSnap = await getDoc(userStreakDocRef);
      let currentDbData: StreakData = initialStreakData;

      if (docSnap.exists()) {
        const rawData = docSnap.data();
        // Defensive parsing for data from getDoc
        currentDbData = {
            currentStreak: typeof rawData.currentStreak === 'number' ? rawData.currentStreak : 0,
            longestStreak: typeof rawData.longestStreak === 'number' ? rawData.longestStreak : 0,
            lastCheckInDate: rawData.lastCheckInDate instanceof Timestamp ? rawData.lastCheckInDate : null,
        };
      }
      
      // Double-check if already checked in based on fresh DB data
      if (currentDbData.lastCheckInDate && isToday(currentDbData.lastCheckInDate.toDate())) {
        toast({ title: 'Already Checked In', description: 'You have already checked in today (verified from DB).' });
        // Sync local state if it was somehow out of sync, though onSnapshot should handle this.
        setStreakData(currentDbData); 
        setAlreadyCheckedInToday(true);
        setIsCheckingIn(false);
        return;
      }

      const today = new Date();
      const todayTimestamp = Timestamp.fromDate(today);
      
      let newCurrentStreak = 1; // Default to 1 if no prior streak or broken streak
      if (currentDbData.lastCheckInDate && isYesterday(currentDbData.lastCheckInDate.toDate())) {
        newCurrentStreak = currentDbData.currentStreak + 1;
      }
      // If lastCheckInDate is null or older than yesterday, streak resets to 1.

      const newLongestStreak = Math.max(currentDbData.longestStreak, newCurrentStreak);

      const updatedData: StreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: todayTimestamp,
      };

      await setDoc(userStreakDocRef, updatedData, { merge: true }); // Use merge:true if creating or partially updating
      
      // No need to call setStreakData here if onSnapshot is working correctly,
      // as it will pick up the change and update the state.
      // setAlreadyCheckedInToday(true); // This will also be handled by onSnapshot via setStreakData

      toast({
        title: 'Checked In!',
        description: `Your current streak is ${newCurrentStreak} ${newCurrentStreak === 1 ? 'day' : 'days'}. Keep it up!`,
      });
    } catch (error: any) {
      console.error('StreaksPage: Error during check-in:', error);
      toast({
        title: 'Check-in Failed',
        description: `Could not process your check-in: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsCheckingIn(false);
    }
  }, [currentUser?.uid, db, toast, streakData]); // Added streakData as it's used for an initial check

  // Show loader only if it's the initial load and we don't have any streak data yet.
  if (loading && !streakData.lastCheckInDate && currentUser?.uid) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show a message prompting login.
  if (!currentUser?.uid) { 
    return (
      <div className="w-full space-y-6">
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
  const lastCheckInDateDisplay = streakData?.lastCheckInDate ? streakData.lastCheckInDate.toDate().toLocaleDateString() : 'Never';

  return (
    <div className="w-full space-y-6">
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
            disabled={alreadyCheckedInToday || isCheckingIn || !db} // db check is a safeguard
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
           <p className="text-sm text-muted-foreground mt-3 text-center">
              Last check-in: {lastCheckInDateDisplay}
           </p>
           {!db && ( // Show if db is not available
            <p className="text-xs text-destructive mt-2 text-center">Database connection not available. Check-in disabled.</p>
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
