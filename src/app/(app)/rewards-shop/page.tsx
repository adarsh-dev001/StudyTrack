
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Coins, Palette, Music2, Smile, ShoppingCart, CheckCircle, Loader2, Gift } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RewardItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: LucideIcon;
  category: 'Theme' | 'Soundtrack' | 'Cosmetic';
  colorClass?: string; // Optional: for styling the card
}

// Sample Rewards - In a real app, this might come from a config or database
const AVAILABLE_REWARDS: RewardItem[] = [
  {
    id: 'theme_crimson_dark',
    name: 'Crimson Dark Theme',
    description: 'A sleek dark theme with crimson accents. (Visual unlock only for now)',
    price: 200,
    icon: Palette,
    category: 'Theme',
    colorClass: 'bg-red-700/10 border-red-700/30 text-red-700 dark:text-red-300',
  },
  {
    id: 'theme_ocean_blue',
    name: 'Ocean Blue Theme',
    description: 'A calming blue theme for focused study. (Visual unlock only for now)',
    price: 200,
    icon: Palette,
    category: 'Theme',
    colorClass: 'bg-sky-700/10 border-sky-700/30 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'sound_lofi_pack_1',
    name: 'Lo-fi Beats Pack Vol. 1',
    description: 'Chill lo-fi tracks to help you concentrate. (Sound playback not implemented)',
    price: 100,
    icon: Music2,
    category: 'Soundtrack',
    colorClass: 'bg-purple-600/10 border-purple-600/30 text-purple-600 dark:text-purple-300',
  },
  {
    id: 'avatar_frame_gold',
    name: 'Golden Avatar Frame',
    description: 'Show off your achievements with a shiny golden avatar frame. (Cosmetic only)',
    price: 300,
    icon: Smile,
    category: 'Cosmetic',
    colorClass: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 dark:text-yellow-300',
  },
];

interface UserShopProfile {
  coins: number;
  purchasedItemIds: string[];
}

export default function RewardsShopPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserShopProfile>({ coins: 0, purchasedItemIds: [] });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    const unsubscribe = getDoc(userProfileDocRef).then(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          coins: data.coins || 0,
          purchasedItemIds: data.purchasedItemIds || [],
        });
      } else {
        // Profile might not exist if user hasn't visited streaks page yet, default it
        setUserProfile({ coins: 0, purchasedItemIds: [] });
      }
      setLoadingProfile(false);
    }).catch(error => {
      console.error("Error fetching user profile for shop:", error);
      toast({ title: 'Error', description: 'Could not load your profile data.', variant: 'destructive' });
      setLoadingProfile(false);
    });
    // This is a one-time fetch for now. For real-time updates, use onSnapshot.
    // return () => unsubscribe(); // Not needed for getDoc
  }, [currentUser?.uid, toast]);

  const handlePurchase = async (item: RewardItem) => {
    if (!currentUser?.uid || !db) {
      toast({ title: 'Error', description: 'You must be logged in to make purchases.', variant: 'destructive' });
      return;
    }

    if (userProfile.purchasedItemIds.includes(item.id)) {
      toast({ title: 'Already Owned', description: `You already own ${item.name}.` });
      return;
    }

    if (userProfile.coins < item.price) {
      toast({ title: 'Insufficient Coins 😟', description: `You need ${item.price - userProfile.coins} more coins for ${item.name}.`, variant: 'destructive' });
      return;
    }

    setPurchasingItemId(item.id);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');

    try {
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(userProfileDocRef);
        if (!sfDoc.exists()) {
          throw new Error("User profile document does not exist!");
        }
        const currentCoins = sfDoc.data().coins || 0;
        const currentPurchasedIds = sfDoc.data().purchasedItemIds || [];

        if (currentCoins < item.price) {
          throw new Error("Not enough coins (verified in transaction).");
        }
        if (currentPurchasedIds.includes(item.id)) {
            throw new Error("Item already purchased (verified in transaction).");
        }

        const newCoins = currentCoins - item.price;
        transaction.update(userProfileDocRef, { 
          coins: newCoins,
          purchasedItemIds: arrayUnion(item.id)
        });
      });

      // Update local state after successful transaction
      setUserProfile(prev => ({
        coins: prev.coins - item.price,
        purchasedItemIds: [...prev.purchasedItemIds, item.id],
      }));

      toast({
        title: 'Purchase Successful! 🎉',
        description: `You've successfully purchased ${item.name}.`,
      });
    } catch (error: any) {
      console.error('Error purchasing item:', error);
      toast({
        title: 'Purchase Failed 😥',
        description: error.message || 'An unexpected error occurred during purchase.',
        variant: 'destructive',
      });
    } finally {
      setPurchasingItemId(null);
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
            <ShoppingCart className="mr-3 h-8 w-8 text-primary" /> Rewards Shop
          </h1>
          <p className="text-lg text-muted-foreground">
            Spend your hard-earned coins on cool rewards! 🪙
          </p>
        </div>
        <Card className="p-3 shadow-md bg-amber-500/10 border-amber-500/30 w-full sm:w-auto">
            <div className="flex items-center justify-center sm:justify-start">
                <Coins className="h-7 w-7 text-amber-600 dark:text-amber-400 mr-2" />
                <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">{userProfile.coins}</span>
                <span className="ml-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">Coins</span>
            </div>
        </Card>
      </header>

      {!currentUser ? (
         <Card className="shadow-lg text-center py-10">
            <CardHeader>
                <Gift className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle className="text-2xl">Log In to Access the Shop</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-md">Please log in to view available rewards and use your coins.</CardDescription>
            </CardContent>
         </Card>
      ) : AVAILABLE_REWARDS.length === 0 ? (
        <Card className="shadow-lg text-center py-10">
            <CardHeader>
                 <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="text-2xl">Shop is Currently Empty</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-md">No rewards available at the moment. Check back soon!</CardDescription>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_REWARDS.map((item) => {
            const isOwned = userProfile.purchasedItemIds.includes(item.id);
            const IconComponent = item.icon;
            return (
              <Card key={item.id} className={cn("shadow-lg flex flex-col transition-all duration-300 transform hover:-translate-y-1", item.colorClass, isOwned && "opacity-70 bg-slate-500/5 dark:bg-slate-800/20")}>
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
                    <p className="text-lg font-semibold flex items-center">
                      <Coins className="mr-1.5 h-5 w-5 text-amber-500" /> {item.price}
                    </p>
                    {isOwned && <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center"><CheckCircle className="mr-1.5 h-4 w-4"/>Owned</span>}
                  </div>
                  <Button
                    onClick={() => handlePurchase(item)}
                    disabled={isOwned || purchasingItemId === item.id || userProfile.coins < item.price}
                    className="w-full"
                    variant={isOwned ? "outline" : "default"}
                  >
                    {purchasingItemId === item.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isOwned ? (
                      'Already Purchased'
                    ) : (
                      'Buy Reward'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
       <Card className="mt-8 p-6 rounded-xl border bg-card text-card-foreground shadow">
          <h2 className="text-xl font-semibold mb-3 flex items-center"><Coins className="mr-2 h-6 w-6 text-amber-500" /> How to Earn Coins?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>✅ Complete daily study tasks.</li>
            <li>🔥 Maintain your study streaks.</li>
            <li>🍅 Finish Pomodoro sessions.</li>
            <li>💡 Ace quizzes and challenges (coming soon!).</li>
            <li><span className="font-semibold text-primary">(Note: Coin earning mechanisms are currently under development and will be activated soon!)</span></li>
          </ul>
        </Card>
    </div>
  );
}

