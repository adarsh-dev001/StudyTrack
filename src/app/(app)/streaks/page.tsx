
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, type Unsubscribe, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Loader2, CalendarCheck2, Award, Star, ShieldCheck, Brain, Clock, Zap, Share2, Copy, Check, Gift } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import type { UserProfileData, StreakData } from '@/lib/profile-types'; 


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
  lastInteractionDates: [], 
};

type BadgeType = 'streak' | 'pomodoro' | 'task' | 'topic';

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  milestone: number;
  type: BadgeType;
  colorClass: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { id: 'streak_1', name: 'Spark Starter', description: 'Checked in for the 1st day!', icon: Flame, milestone: 1, type: 'streak', colorClass: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300' },
  { id: 'streak_3', name: 'Consistent Learner', description: 'Maintained a 3-day streak!', icon: Star, milestone: 3, type: 'streak', colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Completed a 7-day streak!', icon: Award, milestone: 7, type: 'streak', colorClass: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300' },
  { id: 'streak_30', name: 'Monthly Marvel', description: 'Achieved a 30-day streak!', icon: ShieldCheck, milestone: 30, type: 'streak', colorClass: 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300' },
  { id: 'pomodoro_10', name: 'Pomodoro Power', description: 'Completed 10 Pomodoro sessions.', icon: Clock, milestone: 10, type: 'pomodoro', colorClass: 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300' },
  { id: 'task_25', name: 'Task Titan', description: 'Completed 25 study tasks.', icon: Zap, milestone: 25, type: 'task', colorClass: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300' },
];

interface MemoizedBadgeDisplayProps {
  badge: BadgeDefinition;
  isEarned: boolean;
  isCopied: boolean;
  onShare: (badgeName: string) => void;
}

const MemoizedBadgeDisplay = React.memo(function MemoizedBadgeDisplay({
  badge,
  isEarned,
  isCopied,
  onShare,
}: MemoizedBadgeDisplayProps) {
  return (
    <Card className={cn(
        "p-3 sm:p-4 flex flex-col items-center text-center shadow-md", 
        badge.colorClass,
        !isEarned && "border-dashed opacity-70 hover:opacity-100 transition-opacity bg-opacity-5 dark:bg-opacity-5"
      )}
    >
      <div className={cn(
          "p-2 sm:p-3 rounded-full mb-1.5 sm:mb-2 inline-block shadow",
          isEarned ? "bg-white/70 dark:bg-black/30" : "bg-white/50 dark:bg-black/20"
        )}
      >
         <badge.icon className="h-8 w-8 sm:h-10 sm:w-10" />
      </div>
      <h3 className={cn("font-semibold mb-0.5", isEarned ? "text-md sm:text-lg" : "text-sm sm:text-md")}>{badge.name}</h3>
      <p className={cn("text-xs mb-1", isEarned ? "opacity-90" : "opacity-80")}>{badge.description}</p>
      
      {isEarned ? (
        <Button variant="outline" size="xs" onClick={() => onShare(badge.name)} className="mt-auto border-current hover:bg-current/20 w-full text-xs sm:text-sm">
          {isCopied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
          {isCopied ? 'Copied!' : 'Share'}
        </Button>
      ) : (
        <p className="text-xs font-medium mt-auto">
            {badge.type === 'streak' && `Reach a ${badge.milestone}-day streak!`}
            {badge.type === 'pomodoro' && `Complete ${badge.milestone} Pomodoros!`}
            {badge.type === 'task' && `Complete ${badge.milestone} tasks!`}
        </p>
      )}
    </Card>
  );
});


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
          lastInteractionDates: Array.isArray(rawData.lastInteractionDates) ? rawData.lastInteractionDates : [], 
        });
      } else {
        
        const profileToSet = { ...initialUserProfileData, lastInteractionDates: [] };
        setDoc(userProfileDocRef, profileToSet, { merge: true })
          .then(() => setUserProfile(profileToSet))
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
      let currentDbProfileData: UserProfileData = profileDocSnap.exists() 
        ? profileDocSnap.data() as UserProfileData 
        : { ...initialUserProfileData, lastInteractionDates: [] }; 
      
      
      currentDbProfileData.earnedBadgeIds = currentDbProfileData.earnedBadgeIds || [];
      currentDbProfileData.purchasedItemIds = currentDbProfileData.purchasedItemIds || [];
      currentDbProfileData.dailyChallengeStatus = currentDbProfileData.dailyChallengeStatus || {};
      currentDbProfileData.activeThemeId = currentDbProfileData.activeThemeId === undefined ? DEFAULT_THEME_ID : currentDbProfileData.activeThemeId;
      currentDbProfileData.lastInteractionDates = currentDbProfileData.lastInteractionDates || [];


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

      const coinsFromCheckIn = 10 + (newlyEarnedBadges.length > 0 ? 5 : 0);
      const xpFromCheckIn = 5;
      const updatedCoins = (currentDbProfileData.coins || 0) + coinsFromCheckIn;
      const updatedXp = (currentDbProfileData.xp || 0) + xpFromCheckIn;
      
      const profileUpdates: Partial<UserProfileData> = {
        earnedBadgeIds: updatedEarnedBadgeIds,
        coins: updatedCoins,
        xp: updatedXp,
      };
      
      await setDoc(userProfileDocRef, profileUpdates, { merge: true });
      
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

  const handleShareBadge = useCallback((badgeName: string) => {
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
  }, [toast, setCopiedBadgeId]);


  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser?.uid) { 
    return (
      <div className="w-full space-y-6 p-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Study Streaks & Achievements</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Log in to track your consistency and earn badges!</p>
         <Card className="w-full shadow-lg">
          <CardContent className="pt-6 text-center p-4 sm:p-6">
            <p className="text-muted-foreground text-sm sm:text-base">Please log in to view and manage your study streaks and achievements.</p>
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
    <div className="w-full space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">Study Streaks & Achievements</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Track your daily consistency, build strong habits, and unlock cool badges!</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-xl transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl font-semibold">Current Streak</CardTitle>
            <Flame className="h-7 w-7 sm:h-8 sm:w-8 text-orange-500" />
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-4xl sm:text-5xl font-bold text-orange-500">{currentStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">{currentStreakValue === 1 ? 'day' : 'days'} of consistent study</p>
          </CardContent>
        </Card>
        <Card className="shadow-xl transform hover:scale-105 transition-transform duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
            <CardTitle className="text-lg sm:text-xl font-semibold">Longest Streak</CardTitle>
            <Award className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="text-4xl sm:text-5xl font-bold text-primary">{longestStreakValue}</div>
            <p className="text-xs text-muted-foreground pt-1">Your personal best!</p>
          </CardContent>
        </Card>
         <Card className="shadow-xl flex flex-col transform hover:scale-105 transition-transform duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5">
                <CardTitle className="text-lg sm:text-xl font-semibold">Your Rewards</CardTitle>
                <Star className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-400" />
            </CardHeader>
            <CardContent className="flex-grow p-4 sm:p-5">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-500 dark:text-yellow-400">{userProfile.xp} XP</div>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-500 dark:text-yellow-400 mt-1">{userProfile.coins} 🪙</div>
                <p className="text-xs text-muted-foreground pt-1">Earn by checking in, completing challenges & streaks!</p>
            </CardContent>
            <CardFooter className="p-4 sm:p-5">
                 <Button variant="outline" size="sm" asChild className="w-full text-xs sm:text-sm">
                    <Link href="/rewards-shop">
                        Visit Shop <Gift className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Daily Check-in</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {alreadyCheckedInToday ? "You've already checked in for today. Great job!" : "Check in now to maintain your streak & earn rewards!"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Button 
            onClick={handleCheckIn} 
            disabled={alreadyCheckedInToday || isCheckingIn}
            className="w-full text-md sm:text-lg py-3 sm:py-6" size="lg"
          >
            {isCheckingIn ? <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> : (alreadyCheckedInToday ? <CalendarCheck2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> : <Flame className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />)}
            {isCheckingIn ? 'Checking In...' : (alreadyCheckedInToday ? 'Checked In for Today!' : 'Check-in & Earn Rewards')}
          </Button>
           <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 text-center">Last check-in: {lastCheckInDateDisplay}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center"><Award className="mr-2 sm:mr-3 h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" /> Your Achievements</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Celebrate your milestones and dedication!</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {earnedBadges.length === 0 && (
            <p className="text-muted-foreground text-center py-3 sm:py-4 text-sm sm:text-base">No badges unlocked yet. Keep checking in and completing challenges! 💪</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {earnedBadges.map(badge => (
              <MemoizedBadgeDisplay
                key={badge.id}
                badge={badge}
                isEarned={true}
                isCopied={copiedBadgeId === badge.id}
                onShare={handleShareBadge}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {unearnedBadges.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl font-semibold">🎯 Badges to Unlock</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Keep pushing to earn these awesome badges!</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6">
            {unearnedBadges.map(badge => (
              <MemoizedBadgeDisplay
                key={badge.id}
                badge={badge}
                isEarned={false}
                isCopied={false} // Unearned badges cannot be copied
                onShare={() => {}} // No share action for unearned
              />
            ))}
          </CardContent>
        </Card>
      )}

       <div className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Why Track Streaks &amp; Achievements?</h2>
          <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
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
    
