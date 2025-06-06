'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import {
  generatePersonalizedRecommendations,
  type PersonalizedRecommendationsOutput
} from '@/ai/flows/generate-personalized-recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OnboardingForm from '@/components/onboarding/onboarding-form';

export default function AiRecommendationsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');

      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const userProfileData = profileSnap.data() as UserProfileData;
          setProfile(userProfileData);
          if (!userProfileData.onboardingCompleted) {
            setShowOnboardingModal(true);
          } else {
            setShowOnboardingModal(false);
            if (!recommendations && !isLoadingRecommendations && !error) {
              fetchRecommendations(userProfileData);
            }
          }
        } else {
          setProfile(null);
          setShowOnboardingModal(true);
        }
        setIsLoadingProfile(false);
      }, (err) => {
        console.error("Error fetching profile:", err);
        setError("Could not load your profile.");
        setIsLoadingProfile(false);
      });
    }

    return () => unsubscribeProfile?.();
  }, [currentUser]);

  async function fetchRecommendations(userProfile: UserProfileData) {
    setIsLoadingRecommendations(true);
    try {
      const recs = await generatePersonalizedRecommendations(userProfile);
      setRecommendations(recs);
    } catch (err: any) {
      console.error("Recommendation generation failed:", err);
      setError("Could not generate recommendations.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  function OnboardingFormFallback() {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
        <Skeleton className="h-4 w-full mb-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Your AI Page content here */}

      <Dialog open={showOnboardingModal}>
        <DialogContent className="max-h-[90vh] p-0 sm:p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Complete Your Onboarding</DialogTitle>
            <DialogDescription>
              We need your details to personalize your AI experience.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable area */}
          <ScrollArea className="h-[70vh] px-6 pb-6">
            <Suspense fallback={<OnboardingFormFallback />}>
              <OnboardingForm onComplete={() => setShowOnboardingModal(false)} />
            </Suspense>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
