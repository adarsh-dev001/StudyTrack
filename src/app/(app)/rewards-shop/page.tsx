
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, runTransaction, type Unsubscribe, onSnapshot, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Palette, Music2, Smile, ShoppingCart, CheckCircle, Loader2, Gift, Settings2, RefreshCw } from 'lucide-react';
import { ALL_THEMES_DEFINITIONS, type ThemeDefinition, DEFAULT_THEME_ID } from '@/lib/themes';
import { ALL_SOUNDTRACK_DEFINITIONS, type SoundtrackDefinition } from '@/lib/soundtracks';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


interface RewardItemBase {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: 'Theme' | 'Soundtrack' | 'Cosmetic';
  colorClass?: string;
}

type RewardItem = RewardItemBase | (RewardItemBase & ThemeDefinition) | (RewardItemBase & SoundtrackDefinition);


const OTHER_COSMETIC_REWARDS: RewardItemBase[] = [
  {
    id: 'avatar_frame_gold',
    name: 'Golden Avatar Frame',
    description: 'Show off your achievements with a shiny golden avatar frame. (Cosmetic only)',
    icon: Smile,
    category: 'Cosmetic',
    colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 dark:text-yellow-300',
  },
];

const AVAILABLE_REWARDS: RewardItem[] = [
  ...ALL_THEMES_DEFINITIONS.map(themeDef => ({
    ...themeDef,
  })),
  ...ALL_SOUNDTRACK_DEFINITIONS.map(soundtrackDef => ({ 
    ...soundtrackDef,
  })),
  ...OTHER_COSMETIC_REWARDS,
];


interface UserShopProfile {
  coins: number;
  purchasedItemIds: string[];
  activeThemeId?: string | null;
}

export default function RewardsShopPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserShopProfile>({ coins: 0, purchasedItemIds: [], activeThemeId: DEFAULT_THEME_ID });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [actionItemId, setActionItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    
    const unsubscribe = onSnapshot(userProfileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          coins: data.coins || 0,
          purchasedItemIds: data.purchasedItemIds || [],
          activeThemeId: data.activeThemeId === undefined ? DEFAULT_THEME_ID : data.activeThemeId,
        });
      } else {
        setUserProfile({ coins: 0, purchasedItemIds: [], activeThemeId: DEFAULT_THEME_ID });
      }
      setLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching user profile for shop:", error);
      toast({ title: 'Error', description: 'Could not load your profile data.', variant: 'destructive' });
      setLoadingProfile(false);
    });
    
    return () => unsubscribe();
  }, [currentUser?.uid, toast]);

  const handleGenericAction = async (item: RewardItem) => {
    if (!currentUser?.uid || !db) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    toast({
        title: `${item.name} is available!`,
        description: `You can now use this ${item.category.toLowerCase()}.`,
    });
  };


  const handleApplyTheme = async (themeId: string) => {
    if (!currentUser?.uid || !db) return;
    if (themeId === userProfile.activeThemeId) {
        toast({ title: "Theme Info", description: "This theme is already active."});
        return;
    }

    setActionItemId(themeId);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    try {
      const profileSnap = await getDoc(userProfileDocRef);
      if (profileSnap.exists()) {
        await updateDoc(userProfileDocRef, { activeThemeId: themeId });
      } else {
        await setDoc(userProfileDocRef, { 
            activeThemeId: themeId, 
            coins: 0,
            xp: 0,
            earnedBadgeIds: [],
            purchasedItemIds: [],
            dailyChallengeStatus: {}
        });
      }
      toast({
        title: '🎨 Theme Applied!',
        description: 'Your selected theme is now active. Enjoy the new look!',
      });
    } catch (error: any) {
      console.error("Error applying theme:", error);
      toast({ title: 'Error', description: 'Could not apply theme.', variant: 'destructive' });
    } finally {
        setActionItemId(null);
    }
  };

  const handleRevertToDefaultTheme = async () => {
    if (!currentUser?.uid || !db) return;
    if (userProfile.activeThemeId === DEFAULT_THEME_ID || userProfile.activeThemeId === null) {
        toast({ title: "Theme Info", description: "Default theme is already active."});
        return;
    }
    setActionItemId("revert_default_theme_action"); 
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    try {
      await updateDoc(userProfileDocRef, { activeThemeId: DEFAULT_THEME_ID });
      toast({
        title: '🎨 Theme Reverted!',
        description: 'Switched back to the default application theme.',
      });
    } catch (error: any) {
      console.error("Error reverting to default theme:", error);
      toast({ title: 'Error', description: 'Could not revert to default theme.', variant: 'destructive' });
    } finally {
        setActionItemId(null);
    }
  };
  
  if (loadingProfile) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="ml-2 sm:ml-3 text-muted-foreground mt-3">Loading Shop...</p>
      </div>
    );
  }


  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
            <ShoppingCart className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Rewards Hub
          </h1>
          <p className="text-md sm:text-lg text-muted-foreground">
            Customize your experience! All themes and soundtracks are currently free. 🪙
          </p>
        </div>
        <Card className="p-3 shadow-md bg-amber-500/10 border-amber-500/30 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start">
                <Coins className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600 dark:text-amber-400 mr-1.5 sm:mr-2" />
                <span className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{userProfile.coins}</span>
                <span className="ml-1 sm:ml-1.5 text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">Coins Earned</span>
            </div>
        </Card>
      </header>

      {!currentUser ? (
         <Card className="shadow-lg text-center py-8 sm:py-10">
            <CardHeader className="p-4 sm:p-6">
                <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-primary mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-xl sm:text-2xl">Log In to Access Rewards</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-md">Please log in to apply themes and use other rewards.</CardDescription>
            </CardContent>
         </Card>
      ) : AVAILABLE_REWARDS.length === 0 ? (
        <Card className="shadow-lg text-center py-8 sm:py-10">
            <CardHeader className="p-4 sm:p-6">
                 <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <CardTitle className="text-xl sm:text-2xl">Hub is Currently Empty</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <CardDescription className="text-sm sm:text-md">No rewards available at the moment. Check back soon!</CardDescription>
            </CardContent>
        </Card>
      ) : (
        <>
        <div className="flex justify-end">
            <Button 
                variant="outline" 
                onClick={handleRevertToDefaultTheme}
                disabled={actionItemId === "revert_default_theme_action" || userProfile.activeThemeId === DEFAULT_THEME_ID || userProfile.activeThemeId === null}
                className="w-full sm:w-auto text-xs sm:text-sm"
                size="sm"
            >
                {actionItemId === "revert_default_theme_action" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 h-3.5 w-3.5" />}
                Revert to Default Theme
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {AVAILABLE_REWARDS.map((item) => {
            const isActiveTheme = item.category === 'Theme' && item.id === userProfile.activeThemeId;
            const IconComponent = item.icon;
            const isProcessing = actionItemId === item.id;

            return (
              <Card key={item.id} className={cn("shadow-lg flex flex-col transition-all duration-300 transform hover:-translate-y-1", item.colorClass, isActiveTheme && "ring-2 ring-primary shadow-primary/30")}>
                <CardHeader className="flex flex-row items-start gap-3 sm:gap-4 space-y-0 pb-2 sm:pb-3 p-4 sm:p-5">
                  <div className={cn("p-2 sm:p-3 rounded-lg", item.colorClass ? 'bg-current/20 dark:bg-current/30' : 'bg-primary/10' )}>
                    <IconComponent className={cn("h-7 w-7 sm:h-8 sm:w-8", item.colorClass ? 'text-current' : 'text-primary')} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-headline text-lg sm:text-xl">{item.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow p-4 sm:p-5 pt-0">
                  <CardDescription className={cn("text-xs sm:text-sm",item.colorClass ? 'text-current/80 dark:text-current/70' : 'text-muted-foreground')}>{item.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2 sm:gap-3 pt-3 sm:pt-4 border-t p-4 sm:p-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">Free!</span>
                    {isActiveTheme && <Badge variant="default" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-primary/80"><CheckCircle className="mr-1 h-3 w-3"/>Active Theme</Badge>}
                    {!isActiveTheme && item.category === 'Theme' && <Badge variant="outline" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5">Available</Badge>}
                    {item.category !== 'Theme' && <Badge variant="outline" className="text-xs px-1.5 py-0.5 sm:px-2 sm:py-0.5"><CheckCircle className="mr-1 h-3 w-3"/>Available</Badge>}
                  </div>
                  
                  {item.category === 'Theme' ? (
                      <Button
                        onClick={() => handleApplyTheme(item.id)}
                        disabled={isActiveTheme || isProcessing}
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                        variant={isActiveTheme ? "secondary" : "default"}
                      >
                        {isProcessing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : 
                         isActiveTheme ? 'Theme Active' : 'Apply Theme'}
                      </Button>
                  ) : item.category === 'Soundtrack' ? (
                     <Button
                        onClick={() => toast({ title: `${item.name} is available!`, description: "Select it in the Pomodoro timer settings."})}
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                        variant="outline"
                    >
                        Available to Use
                    </Button>
                  ) : ( 
                     <Button
                        onClick={() => handleGenericAction(item)}
                        disabled={isProcessing}
                        className="w-full text-xs sm:text-sm"
                        size="sm"
                        variant="outline"
                    >
                        {isProcessing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : 'View Details (Available)'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
        </>
      )}
      
       <Card className="mt-6 sm:mt-8 p-4 sm:p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center"><Coins className="mr-1.5 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6 text-amber-500" /> How to Earn Coins?</h2>
          <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li>✅ Complete daily study tasks: **+2 Coins** per task.</li>
            <li>🔥 Maintain your study streaks: **+10 Coins** for daily check-in (+5 bonus for new badge days).</li>
            <li>🍅 Finish Pomodoro sessions: **+5 Coins** per Pomodoro.</li>
            <li>🏆 Complete Daily Challenges on your Dashboard for bonus XP & Coins!</li>
            <li>💡 Ace quizzes and other challenges (coming soon!).</li>
          </ul>
        </Card>
    </div>
  );
}
    
