
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, type Unsubscribe, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Loader2, CalendarCheck2, Award, Star, ShieldCheck, Brain, Clock, Zap, Share2, Copy, Check, Gift } from 'lucide-react'; // Added Gift
import type { LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DEFAULT_THEME_ID } from '@/lib/themes';


interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Timestamp | null;
}

// Combined User Profile Data
interface UserProfileData {
  earnedBadgeIds: string[];
  xp: number;
  coins: number;
  purchasedItemIds: string[];
  activeThemeId?: string | null; 
  dailyChallengeStatus?: { [challengeId: string]: { completedOn: Timestamp } }; 
}

const initialStreakData: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
};

const initialUserProfileData: UserProfileData = {
  earnedBadgeIds: [],
  xp: 0,
  coins: 0,
  purchasedItemIds: [],
  activeThemeId: DEFAULT_THEME_ID,
  dailyChallengeStatus: {},
};

// Define Badge Types
type BadgeType = 'streak' | 'pomodoro' | 'task' | 'topic'; // topic type not used for now

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  milestone: number; // e.g., days for streak, count for pomodoros/tasks
  type: BadgeType;
  colorClass: string; // For styling the badge card
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'streak_1', name: 'Spark Starter', description: 'Checked in for the 1st day!', icon: Flame, milestone: 1, type: 'streak', colorClass: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300' },
  { id: 'streak_3', name: 'Consistent Learner', description: 'Maintained a 3-day streak!', icon: Star, milestone: 3, type: 'streak', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Completed a 7-day streak!', icon: Award, milestone: 7, type: 'streak', colorClass: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300' },
  { id: 'streak_30', name: 'Monthly Marvel', description: 'Achieved a 30-day streak!', icon: ShieldCheck, milestone: 30, type: 'streak', colorClass: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300' },
  // Mocked/Placeholder Badges for future features
  { id: 'pomodoro_10', name: 'Pomodoro Power', description: 'Completed 10 Pomodoro sessions.', icon: Clock, milestone: 10, type: 'pomodoro', colorClass: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' },
  { id: 'task_25', name: 'Task Titan', description: 'Completed 25 study tasks.', icon: Zap, milestone: 25, type: 'task', colorClass: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300' },
];


export default function StreaksPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [streakData, setStreakData] = useState<StreakData>(initialStreakData);
  const [userProfile, setUserProfile] = useState<UserProfileData>(initialUserProfileData);
  const [loading, setLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState(false);
  const [copiedBadgeId, setCopiedBadgeId] = useState<string | null>(null);


  const streakUnsubscribeRef = useRef<Unsubscribe | null>(null);
  const profileUnsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    // Clear previous listeners
    if (streakUnsubscribeRef.current) streakUnsubscribeRef.current();
    if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
    streakUnsubscribeRef.current = null;
    profileUnsubscribeRef.current = null;

    if (!currentUser?.uid || !db) {
      setLoading(false);
      setStreakData(initialStreakData);
      setUserProfile(initialUserProfileData);
      setAlreadyCheckedInToday(false);
      return;
    }

    setLoading(true);

    // Listener for Streak Data
    const userStreakDocRef = doc(db, 'users', currentUser.uid, 'streaksData', 'main');
    streakUnsubscribeRef.current = onSnapshot(userStreakDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        const validatedData: StreakData = {
          currentStreak: typeof rawData.currentStreak === 'number' ? rawData.currentStreak : 0,
          longestStreak: typeof rawData.longestStreak === 'number' ? rawData.longestStreak : 0,
          lastCheckInDate: rawData.lastCheckInDate instanceof Timestamp ? rawData.lastCheckInDate : null,
        };
        setStreakData(validatedData);
        setAlreadyCheckedInToday(!!(validatedData.lastCheckInDate && isToday(validatedData.lastCheckInDate.toDate())));
      } else {
        setStreakData(initialStreakData);
        setAlreadyCheckedInToday(false);
      }
      setLoading(false); 
    }, (error) => {
      console.error('Error fetching streak data:', error);
      toast({ title: 'Error Loading Streaks', description: 'Could not load streak data.', variant: 'destructive' });
      setLoading(false);
    });

    // Listener for User Profile Data (Badges, XP, Coins, Theme, Challenges)
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    profileUnsubscribeRef.current = onSnapshot(userProfileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        setUserProfile({
          earnedBadgeIds: Array.isArray(rawData.earnedBadgeIds) ? rawData.earnedBadgeIds : [],
          xp: typeof rawData.xp === 'number' ? rawData.xp : 0,
          coins: typeof rawData.coins === 'number' ? rawData.coins : 0,
          purchasedItemIds: Array.isArray(rawData.purchasedItemIds) ? rawData.purchasedItemIds : [],
          activeThemeId: typeof rawData.activeThemeId === 'string' ? rawData.activeThemeId : DEFAULT_THEME_ID,
          dailyChallengeStatus: typeof rawData.dailyChallengeStatus === 'object' ? rawData.dailyChallengeStatus : {},
        });
      } else {
        // If profile doesn't exist, create it with initial values
        setDoc(userProfileDocRef, initialUserProfileData, { merge: true })
          .then(() => setUserProfile(initialUserProfileData))
          .catch(err => console.error("Error creating initial user profile:", err));
      }
    }, (error) => {
      console.error('Error fetching user profile data:', error);
      toast({ title: 'Error Loading Profile', description: 'Could not load profile data.', variant: 'destructive' });
    });

    return () => {
      if (streakUnsubscribeRef.current) streakUnsubscribeRef.current();
      if (profileUnsubscribeRef.current) profileUnsubscribeRef.current();
    };
  }, [currentUser?.uid, toast]);


  const handleCheckIn = useCallback(async () => {
    const currentUserId = currentUser?.uid;
    if (!currentUserId || !db) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }

    if (streakData.lastCheckInDate && isToday(streakData.lastCheckInDate.toDate())) {
      toast({ title: 'Already Checked In', description: 'You have already checked in for today!' });
      return;
    }
    
    setIsCheckingIn(true);
    const userStreakDocRef = doc(db, 'users', currentUserId, 'streaksData', 'main');
    const userProfileDocRef = doc(db, 'users', currentUserId, 'userProfile', 'profile');

    try {
      const [streakDocSnap, profileDocSnap] = await Promise.all([
        getDoc(userStreakDocRef),
        getDoc(userProfileDocRef)
      ]);

      let currentDbStreakData = streakDocSnap.exists() ? streakDocSnap.data() as StreakData : initialStreakData;
      // Use initialUserProfileData as a base for a new profile, ensuring all fields including activeThemeId are set
      let currentDbProfileData = profileDocSnap.exists() ? profileDocSnap.data() as UserProfileData : {...initialUserProfileData}; 
      
      // Ensure arrays and objects exist on profile data
      currentDbProfileData.earnedBadgeIds = currentDbProfileData.earnedBadgeIds || [];
      currentDbProfileData.purchasedItemIds = currentDbProfileData.purchasedItemIds || [];
      currentDbProfileData.dailyChallengeStatus = currentDbProfileData.dailyChallengeStatus || {};
      currentDbProfileData.activeThemeId = currentDbProfileData.activeThemeId === undefined ? DEFAULT_THEME_ID : currentDbProfileData.activeThemeId;


      if (currentDbStreakData.lastCheckInDate && isToday(currentDbStreakData.lastCheckInDate.toDate())) {
        toast({ title: 'Already Checked In', description: 'You have already checked in today (verified from DB).' });
        setStreakData(currentDbStreakData); 
        setAlreadyCheckedInToday(true);
        setIsCheckingIn(false);
        return;
      }

      const todayTimestamp = Timestamp.fromDate(new Date());
      let newCurrentStreak = 1;
      if (currentDbStreakData.lastCheckInDate && isYesterday(currentDbStreakData.lastCheckInDate.toDate())) {
        newCurrentStreak = currentDbStreakData.currentStreak + 1;
      }
      const newLongestStreak = Math.max(currentDbStreakData.longestStreak, newCurrentStreak);

      const updatedStreakData: StreakData = {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastCheckInDate: todayTimestamp,
      };
      await setDoc(userStreakDocRef, updatedStreakData, { merge: true });

      const newlyEarnedBadges: BadgeDefinition[] = [];
      const updatedEarnedBadgeIds = [...currentDbProfileData.earnedBadgeIds];

      BADGE_DEFINITIONS.forEach(badge => {
        if (badge.type === 'streak' && newCurrentStreak >= badge.milestone) {
          if (!currentDbProfileData.earnedBadgeIds.includes(badge.id)) {
            updatedEarnedBadgeIds.push(badge.id);
            newlyEarnedBadges.push(badge);
          }
        }
      });

      // Give 10 coins for check-in, 5 more if it's a new badge day
      const coinsFromCheckIn = 10 + (newlyEarnedBadges.length > 0 ? 5 : 0);
      const xpFromCheckIn = 5; // Static XP for now
      const updatedCoins = (currentDbProfileData.coins || 0) + coinsFromCheckIn;
      const updatedXp = (currentDbProfileData.xp || 0) + xpFromCheckIn;

      // Prepare profile updates, ensuring all fields from UserProfileData are included if creating anew
      const profileUpdates: UserProfileData = {
        earnedBadgeIds: updatedEarnedBadgeIds,
        coins: updatedCoins,
        xp: updatedXp,
        purchasedItemIds: currentDbProfileData.purchasedItemIds, // Persist existing or default []
        activeThemeId: currentDbProfileData.activeThemeId,     // Persist existing or default
        dailyChallengeStatus: currentDbProfileData.dailyChallengeStatus, // Persist existing or default {}
      };
      
      await setDoc(userProfileDocRef, profileUpdates, { merge: true }); // merge ensures we don't wipe other fields
      
      newlyEarnedBadges.forEach(badge => {
        toast({
          title: `🎉 Badge Unlocked: ${badge.name}!`,
          description: badge.description,
        });
      });
      
      toast({
        title: 'Checked In Successfully!',
        description: `Streak: ${newCurrentStreak} ${newCurrentStreak === 1 ? 'day' : 'days'}. +${xpFromCheckIn} XP, +${coinsFromCheckIn} Coins! 🪙`,
      });

    } catch (error: any) {
      console.error('Error during check-in or badge awarding:', error);
      toast({ title: 'Check-in Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsCheckingIn(false);
    }
  }, [currentUser?.uid, toast, streakData]);

  const handleShareBadge = (badgeName: string) => {
    const shareText = `I just unlocked the "${badgeName}" badge on StudyTrack! 🚀 #StudyTrack #Achievement`;
    navigator.clipboard.writeText(shareText).then(() => {
        const badgeId = BADGE_DEFINITIONS.find(b => b.name === badgeName)?.id;
        if (badgeId) {
            setCopiedBadgeId(badgeId);
            setTimeout(() => setCopiedBadgeId(null), 2000); 
        }
        toast({
            title: 'Share Message Copied!',
            description: 'A message has been copied to your clipboard. Paste it to share!',
        });
    }).catch(err => {
        console.error('Failed to copy share text: ', err);
        toast({
            title: 'Sharing (Placeholder)',
            description: `Sharing the "${badgeName}" badge is coming soon! For now, spread the word! ✨`,
        });
    });
};


  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.uid) { 
    return (
      <div className="w-full space-y-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Study Streaks & Achievements</h1>
        <p className="text-lg text-muted-foreground">Log in to track your consistency and earn badges!</p>
         <Card className="w-full shadow-lg">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Please log in to view and manage your study streaks and achievements.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentStreakValue = streakData?.currentStreak || 0;
  const longestStreakValue = streakData?.longestStreak || 0;
  const lastCheckInDateDisplay = streakData?.lastCheckInDate ? streakData.lastCheckInDate.toDate().toLocaleDateString() : 'Never';

  const earnedBadges = BADGE_DEFINITIONS.filter(badge => userProfile.earnedBadgeIds.includes(badge.id));
  const unearnedBadges = BADGE_DEFINITIONS.filter(badge => !userProfile.earnedBadgeIds.includes(badge.id));


  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Study Streaks & Achievements</h1>
        <p className="text-lg text-muted-foreground">Track your daily consistency, build strong habits, and unlock cool badges!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-xl transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Current Streak</CardTitle>
            <Flame className="h-8 w-8 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-orange-500">{currentStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">{currentStreakValue === 1 ? 'day' : 'days'} of consistent study</p>
          </CardContent>
        </Card>
        <Card className="shadow-xl transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Longest Streak</CardTitle>
            <Award className="h-8 w-8 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-bold text-primary">{longestStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">Your personal best!</p>
          </CardContent>
        </Card>
         <Card className="shadow-xl flex flex-col transform hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-semibold">Your Rewards</CardTitle>
                <Star className="h-8 w-8 text-yellow-400" />
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{userProfile.xp} XP</div>
                <div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400 mt-1">{userProfile.coins} 🪙</div>
                <p className="text-xs text-muted-foreground pt-1">Earn by checking in, completing challenges & streaks!</p>
            </CardContent>
            <CardFooter>
                 <Button variant="outline" size="sm" asChild>
                    <Link href="/rewards-shop">
                        Visit Shop <Gift className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Daily Check-in</CardTitle>
          <CardDescription>
            {alreadyCheckedInToday ? "You've already checked in for today. Great job!" : "Check in now to maintain your streak & earn rewards!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCheckIn} 
            disabled={alreadyCheckedInToday || isCheckingIn}
            className="w-full text-lg py-6" size="lg"
          >
            {isCheckingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (alreadyCheckedInToday ? <CalendarCheck2 className="mr-2 h-5 w-5" /> : <Flame className="mr-2 h-5 w-5" />)}
            {isCheckingIn ? 'Checking In...' : (alreadyCheckedInToday ? 'Checked In for Today!' : 'Check-in & Earn Rewards')}
          </Button>
           <p className="text-sm text-muted-foreground mt-3 text-center">Last check-in: {lastCheckInDateDisplay}</p>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold flex items-center"><Award className="mr-3 h-7 w-7 text-yellow-500" /> Your Achievements</CardTitle>
          <CardDescription>Celebrate your milestones and dedication!</CardDescription>
        </CardHeader>
        <CardContent>
          {earnedBadges.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No badges unlocked yet. Keep checking in and completing challenges! 💪</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earnedBadges.map(badge => (
              <Card key={badge.id} className={cn("p-4 flex flex-col items-center text-center shadow-md", badge.colorClass)}>
                <div className="p-3 bg-white/70 dark:bg-black/30 rounded-full mb-2 inline-block shadow">
                   <badge.icon className="h-10 w-10" />
                </div>
                <h3 className="font-semibold text-lg mb-0.5">{badge.name}</h3>
                <p className="text-xs opacity-90 mb-2">{badge.description}</p>
                <Button variant="outline" size="sm" onClick={() => handleShareBadge(badge.name)} className="mt-auto border-current hover:bg-current/20">
                  {copiedBadgeId === badge.id ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copiedBadgeId === badge.id ? 'Copied!' : 'Share'}
                </Button>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {unearnedBadges.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">🎯 Badges to Unlock</CardTitle>
            <CardDescription>Keep pushing to earn these awesome badges!</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unearnedBadges.map(badge => (
              <Card key={badge.id} className={cn("p-4 flex flex-col items-center text-center border-dashed opacity-70 hover:opacity-100 transition-opacity", badge.colorClass, "bg-opacity-5 dark:bg-opacity-5")}>
                 <div className="p-3 bg-white/50 dark:bg-black/20 rounded-full mb-2 inline-block shadow-sm">
                    <badge.icon className="h-10 w-10" />
                 </div>
                <h3 className="font-semibold text-md mb-0.5">{badge.name}</h3>
                <p className="text-xs opacity-80 mb-1">{badge.description}</p>
                <p className="text-xs font-medium mt-auto">
                    {badge.type === 'streak' && `Reach a ${badge.milestone}-day streak!`}
                    {badge.type === 'pomodoro' && `Complete ${badge.milestone} Pomodoros!`}
                    {badge.type === 'task' && `Complete ${badge.milestone} tasks!`}
                </p>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

       <div className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-xl font-semibold mb-3">Why Track Streaks &amp; Achievements?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>✅ Builds a powerful habit of daily studying.</li>
            <li>🚀 Provides motivation to stay consistent.</li>
            <li>📊 Visualizes your commitment and progress over time.</li>
            <li>💡 Helps in identifying patterns and overcoming procrastination.</li>
            <li>🏆 Unlock cool badges as a reward for your hard work!</li>
          </ul>
        </div>
    </div>
  );
}

    
