
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { PlannerHeader } from '@/components/planner/planner-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { ScrollArea } from '@/components/ui/scroll-area';

const PlannerView = React.lazy(() => import('@/components/planner/planner-view').then(module => ({ default: module.PlannerView })));
const DayView = React.lazy(() => import('@/components/planner/day-view'));
const MonthView = React.lazy(() => import('@/components/planner/month-view'));

const ALL_SUBJECTS_FILTER_VALUE = "all";

// Fallback components
function PlannerViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Study Planner...</p>
      <div className="w-full mt-6 space-y-3">
        <Skeleton className="h-10 w-full opacity-50" />
        <div className="grid grid-cols-7 gap-2">
            {Array.from({length: 7}).map((_, i) => <Skeleton key={i} className="h-64 w-full opacity-30" />)}
        </div>
      </div>
    </div>
  );
}

function DayViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Day View...</p>
    </div>
  );
}

function MonthViewFallback() {
  return (
    <div className="flex-grow overflow-hidden p-4 border rounded-lg shadow flex flex-col items-center justify-center min-h-[400px] bg-card">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Loading Month View...</p>
    </div>
  );
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

export default function StudyPlannerPage() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSubject, setSelectedSubject] = useState<string>(ALL_SUBJECTS_FILTER_VALUE);

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const userProfileData = profileSnap.data() as UserProfileData;
          setUserProfile(userProfileData);
          if (!userProfileData.onboardingCompleted) {
            setShowOnboardingModal(true);
          } else {
            setShowOnboardingModal(false);
          }
        } else {
          setUserProfile(null);
          setShowOnboardingModal(true); 
        }
        setIsLoadingProfile(false);
      }, (err) => {
        console.error("Error fetching profile for Study Planner:", err);
        setIsLoadingProfile(false);
      });
    } else {
      setIsLoadingProfile(false);
    }
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [currentUser?.uid]);

  const handleOnboardingSuccess = () => {
    setShowOnboardingModal(false);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading planner and profile...</p>
      </div>
    );
  }

  if (showOnboardingModal && currentUser) {
    return (
      <Dialog open={showOnboardingModal} onOpenChange={(isOpen) => {
        if (!currentUser) return;
        if (!isOpen && userProfile && !userProfile.onboardingCompleted) {
           setShowOnboardingModal(true); 
           return;
        }
        setShowOnboardingModal(isOpen);
      }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6 border-b text-center shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Please provide your details to personalize your StudyTrack experience and unlock AI features.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-8rem)] p-4 sm:p-6">
              <Suspense fallback={<OnboardingFormFallback />}>
                <OnboardingForm userId={currentUser.uid} onComplete={handleOnboardingSuccess} />
              </Suspense>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="w-full flex h-full flex-col space-y-4">
      <PlannerHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        allSubjectsValue={ALL_SUBJECTS_FILTER_VALUE}
      />
      <div className="flex-grow overflow-hidden">
        {(!currentUser || (userProfile && !userProfile.onboardingCompleted)) && !showOnboardingModal && (
             <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] text-center p-6">
                <p className="text-lg text-muted-foreground">
                    {currentUser ? "Please complete your profile setup to use the Study Planner effectively." : "Please log in to use the Study Planner."}
                </p>
                {!currentUser && <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/login'; }} className="mt-4">Log In</Button>}
             </div>
        )}
        {currentUser && userProfile?.onboardingCompleted && currentView === 'week' && (
          <Suspense fallback={<PlannerViewFallback />}>
            <PlannerView
              selectedDate={selectedDate}
              selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
              onDateChange={setSelectedDate}
              onViewChange={setCurrentView}
            />
          </Suspense>
        )}
        {currentUser && userProfile?.onboardingCompleted && currentView === 'day' && (
           <Suspense fallback={<DayViewFallback />}>
            <DayView
              selectedDate={selectedDate}
              selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
            />
          </Suspense>
        )}
        {currentUser && userProfile?.onboardingCompleted && currentView === 'month' && (
          <Suspense fallback={<MonthViewFallback />}>
            <MonthView
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onViewChange={setCurrentView}
                selectedSubjectFilter={selectedSubject === ALL_SUBJECTS_FILTER_VALUE ? null : selectedSubject}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
    
