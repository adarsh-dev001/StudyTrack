
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
import { ALL_SOUNDTRACK_DEFINITIONS, type SoundtrackDefinition } from '@/lib/soundtracks'; // Import soundtracks
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


interface RewardItemBase {
  id: string;
  name: string;
  description: string;
  // price: number; // Price removed
  icon: LucideIcon;
  category: 'Theme' | 'Soundtrack' | 'Cosmetic';
  colorClass?: string;
}

// Combine ThemeDefinition and SoundtrackDefinition with RewardItemBase
type RewardItem = RewardItemBase | (RewardItemBase & ThemeDefinition) | (RewardItemBase & SoundtrackDefinition);


const OTHER_COSMETIC_REWARDS: RewardItemBase[] = [
  {
    id: 'avatar_frame_gold',
    name: 'Golden Avatar Frame',
    description: 'Show off your achievements with a shiny golden avatar frame. (Cosmetic only)',
    // price: 300, // Price removed
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
  purchasedItemIds: string[]; // Kept for potential future use or other types of rewards
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
          purchasedItemIds: data.purchasedItemIds || [], // Still fetch, might be used for other things
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

  // Simplified handlePurchase - now only relevant for items that might still have a "claim" or explicit "get" action
  // For themes, applying is the main action. For soundtracks/cosmetics, they are just available.
  // This function might be removed or repurposed if no items require explicit "claiming".
  // For now, it's effectively a no-op for themes/soundtracks as they are auto-available.
  const handleGenericAction = async (item: RewardItem) => {
    if (!currentUser?.uid || !db) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    // If there were cosmetics that needed to be "unlocked" (even for free), logic would go here.
    // For now, most items are either applied (themes) or implicitly available (soundtracks).
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
      // Ensure profile exists before updating, or create it
      const profileSnap = await getDoc(userProfileDocRef);
      if (profileSnap.exists()) {
        await updateDoc(userProfileDocRef, { activeThemeId: themeId });
      } else {
        // If profile doesn't exist, create it with this theme active and default other values
        await setDoc(userProfileDocRef, { 
            activeThemeId: themeId, 
            coins: 0, // Or fetch if relevant, default to 0 if new
            xp: 0,
            earnedBadgeIds: [],
            purchasedItemIds: [], // No purchases needed for themes now
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Loading Shop...</p>
      </div>
    );
  }


  return (
    <div className="w-full space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" /> Rewards Hub
          </h1>
          <p className="text-lg text-muted-foreground">
            Customize your experience! All themes and soundtracks are currently free. 🪙
          </p>
        </div>
        <Card className="p-3 shadow-md bg-amber-500/10 border-amber-500/30 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start">
                <Coins className="h-7 w-7 text-amber-600 dark:text-amber-400 mr-2" />
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{userProfile.coins}</span>
                <span className="ml-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">Coins Earned</span>
            </div>
        </Card>
      </header>

      {!currentUser ? (
         <Card className="shadow-lg text-center py-10">
            <CardHeader>
                <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Log In to Access Rewards</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-md">Please log in to apply themes and use other rewards.</CardDescription>
            </CardContent>
         </Card>
      ) : AVAILABLE_REWARDS.length === 0 ? (
        <Card className="shadow-lg text-center py-10">
            <CardHeader>
                 <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl">Hub is Currently Empty</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-md">No rewards available at the moment. Check back soon!</CardDescription>
            </CardContent>
        </Card>
      ) : (
        <>
        <div className="flex justify-end">
            <Button 
                variant="outline" 
                onClick={handleRevertToDefaultTheme}
                disabled={actionItemId === "revert_default_theme_action" || userProfile.activeThemeId === DEFAULT_THEME_ID || userProfile.activeThemeId === null}
                className="w-full sm:w-auto"
            >
                {actionItemId === "revert_default_theme_action" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Revert to Default Theme
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_REWARDS.map((item) => {
            // const isOwned = true; // All items are effectively owned/available
            const isActiveTheme = item.category === 'Theme' && item.id === userProfile.activeThemeId;
            const IconComponent = item.icon;
            const isProcessing = actionItemId === item.id;

            return (
              <Card key={item.id} className={cn("shadow-lg flex flex-col transition-all duration-300 transform hover:-translate-y-1", item.colorClass, isActiveTheme && "ring-2 ring-primary shadow-primary/30")}>
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                  <div className={cn("p-3 rounded-lg", item.colorClass ? 'bg-current/20 dark:bg-current/30' : 'bg-primary/10' )}>
                    <IconComponent className={cn("h-8 w-8", item.colorClass ? 'text-current' : 'text-primary')} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription className={cn(item.colorClass ? 'text-current/80 dark:text-current/70' : 'text-muted-foreground')}>{item.description}</CardDescription>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-3 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">Free!</span>
                    {isActiveTheme && <Badge variant="default" className="text-xs bg-primary/80"><CheckCircle className="mr-1.5 h-3 w-3"/>Active Theme</Badge>}
                    {!isActiveTheme && item.category === 'Theme' && <Badge variant="outline" className="text-xs">Available</Badge>}
                    {item.category !== 'Theme' && <Badge variant="outline" className="text-xs"><CheckCircle className="mr-1.5 h-3 w-3"/>Available</Badge>}
                  </div>
                  
                  {item.category === 'Theme' ? (
                      <Button
                        onClick={() => handleApplyTheme(item.id)}
                        disabled={isActiveTheme || isProcessing}
                        className="w-full"
                        variant={isActiveTheme ? "secondary" : "default"}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                         isActiveTheme ? 'Theme Active' : 'Apply Theme'}
                      </Button>
                  ) : item.category === 'Soundtrack' ? (
                     <Button
                        onClick={() => toast({ title: `${item.name} is available!`, description: "Select it in the Pomodoro timer settings."})}
                        className="w-full"
                        variant="outline"
                    >
                        Available to Use
                    </Button>
                  ) : ( // Other cosmetics
                     <Button
                        onClick={() => handleGenericAction(item)}
                        disabled={isProcessing}
                        className="w-full"
                        variant="outline"
                    >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'View Details (Available)'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
        </>
      )}
      
       <Card className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center"><Coins className="mr-2 h-6 w-6 text-amber-500" /> How to Earn Coins?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
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
    
