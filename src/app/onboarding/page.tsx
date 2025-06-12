// This page is no longer directly used for mandatory onboarding.
// Onboarding is now contextual, triggered by AI tool usage if profile is incomplete.
// Keeping the file for now in case it's needed for a manual "Edit Full Profile" later,
// but its current role as an automatic redirect target is removed.

'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';

export default function OnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
      return;
    }

    const checkProfile = async () => {
      if (!currentUser?.uid) return;
      
      const profileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data() as UserProfileData;
        if (profileData.hasCompletedOnboarding) {
          router.push('/dashboard');
        }
      }
    };

    checkProfile();
  }, [currentUser, authLoading, router]);

  const handleOnboardingSuccess = () => {
    toast({
      title: 'Profile Setup Complete! 🎉',
      description: "Your preferences have been saved. You're all set to explore StudyTrack!",
      duration: 3000,
    });
    router.push('/dashboard');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-2 sm:p-4 md:p-6 lg:p-8">
      <OnboardingForm userId={currentUser.uid} onComplete={handleOnboardingSuccess} />
    </div>
  );
}
