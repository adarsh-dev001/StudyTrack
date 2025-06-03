
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Coins as CoinsIcon, Flame, Loader2 } from 'lucide-react'; // Renamed Coins to CoinsIcon to avoid conflict
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { UserProfileData, StreakData } from '@/lib/profile-types';
import { motion } from 'framer-motion';

interface DashboardMetricsCardProps {
  streakData: StreakData | null;
  loadingStreak: boolean;
}

interface MetricDisplayProps {
  icon: React.ElementType;
  value: string | number;
  label: string;
  colorClass: string;
  iconColorClass: string;
  isLoading: boolean;
}

const MetricItem: React.FC<MetricDisplayProps> = ({ icon: Icon, value, label, colorClass, iconColorClass, isLoading }) => (
  <div className={`flex-1 p-3 sm:p-4 rounded-lg flex flex-col items-center justify-center text-center ${colorClass}`}>
    <Icon className={`h-6 w-6 sm:h-7 sm:w-7 mb-1 sm:mb-1.5 ${iconColorClass}`} />
    {isLoading ? (
      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
    ) : (
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
    )}
    <div className="text-xs sm:text-sm font-medium opacity-90">{label}</div>
  </div>
);

export default function DashboardMetricsCard({ streakData, loadingStreak }: DashboardMetricsCardProps) {
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState<Partial<UserProfileData>>({ xp: 0, coins: 0 });
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    if (currentUser?.uid && db) {
      setLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribe = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserProfile({
            xp: data.xp || 0,
            coins: data.coins || 0,
          });
        } else {
          setUserProfile({ xp: 0, coins: 0 });
        }
        setLoadingProfile(false);
      }, (error) => {
        console.error("Error fetching profile for metrics:", error);
        setUserProfile({ xp: 0, coins: 0 });
        setLoadingProfile(false);
      });
    } else {
      setLoadingProfile(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser?.uid]);

  const isLoadingCombined = loadingProfile || loadingStreak;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="shadow-lg">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <MetricItem
              icon={Award}
              value={userProfile.xp ?? 0}
              label="XP Earned"
              colorClass="bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
              iconColorClass="text-yellow-500"
              isLoading={isLoadingCombined}
            />
            <MetricItem
              icon={CoinsIcon}
              value={userProfile.coins ?? 0}
              label="Coins"
              colorClass="bg-green-500/10 text-green-700 dark:text-green-300"
              iconColorClass="text-green-500"
              isLoading={isLoadingCombined}
            />
            <MetricItem
              icon={Flame}
              value={streakData?.currentStreak ?? 0}
              label="Current Streak"
              colorClass="bg-orange-500/10 text-orange-700 dark:text-orange-300"
              iconColorClass="text-orange-500"
              isLoading={isLoadingCombined}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
