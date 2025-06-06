
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import {
  generatePersonalizedRecommendations,
  type PersonalizedRecommendationsOutput,
  type PersonalizedRecommendationsInput, // Ensure input type is available if needed here
} from '@/ai/flows/generate-personalized-recommendations';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Brain, ListChecks, CalendarClock, Flag, Target as TargetIcon, Goal, Lightbulb, Zap, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

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

function RecommendationsSkeleton() {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="space-y-2 p-3 border rounded-md">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
             <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full mb-3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
}

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
            // Check if recommendations need to be fetched
            if (!recommendations && !isLoadingRecommendations && !error) {
              fetchRecommendations(userProfileData);
            }
          }
        } else {
          setProfile(null);
          setShowOnboardingModal(true); // Prompt onboarding if profile doesn't exist
        }
        setIsLoadingProfile(false);
      }, (err) => {
        console.error("Error fetching profile:", err);
        setError("Could not load your profile.");
        setIsLoadingProfile(false);
      });
    } else {
        setIsLoadingProfile(false);
        setShowOnboardingModal(false);
    }

    return () => unsubscribeProfile?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]); // recommendations, isLoadingRecommendations, error removed to avoid re-fetch loops

  async function fetchRecommendations(userProfile: UserProfileData) {
    setIsLoadingRecommendations(true);
    setError(null); // Reset error before new fetch
    try {
       // Map UserProfileData to PersonalizedRecommendationsInput if necessary
       const inputForAI: PersonalizedRecommendationsInput = {
        name: userProfile.fullName,
        targetExams: userProfile.targetExams,
        otherExamName: userProfile.otherExamName,
        examAttemptYear: userProfile.examAttemptYear,
        languageMedium: userProfile.languageMedium,
        dailyStudyHours: userProfile.dailyStudyHours,
        studyMode: userProfile.studyMode,
        examPhase: userProfile.examPhase,
        previousAttempts: userProfile.previousAttempts,
        preferredStudyTime: userProfile.preferredStudyTime,
        weakSubjects: userProfile.weakSubjects,
        strongSubjects: userProfile.strongSubjects,
        subjectDetails: userProfile.subjectDetails,
        preferredLearningStyles: userProfile.preferredLearningStyles,
        motivationType: userProfile.motivationType,
        age: userProfile.age,
        location: userProfile.location,
        distractionStruggles: userProfile.distractionStruggles,
      };
      const recs = await generatePersonalizedRecommendations(inputForAI);
      setRecommendations(recs);
    } catch (err: any) {
      console.error("Recommendation generation failed:", err);
      setError("Could not generate recommendations. Please try refreshing. If the issue persists, the AI might be under heavy load.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    // Re-fetch profile to get updated onboarding status and then fetch recommendations
    if(currentUser?.uid) {
        const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
        onSnapshot(profileDocRef, (profileSnap) => { // Use onSnapshot to get live update
            if (profileSnap.exists()) {
                const userProfileData = profileSnap.data() as UserProfileData;
                setProfile(userProfileData); // Update profile state
                if (userProfileData.onboardingCompleted && !recommendations && !isLoadingRecommendations && !error) {
                    fetchRecommendations(userProfileData);
                }
            }
        });
    }
  };


  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Your Profile...</p>
      </div>
    );
  }

  if (showOnboardingModal && currentUser) {
    return (
      <Dialog open={showOnboardingModal} onOpenChange={(isOpen) => {
          if (!currentUser) return;
          if (!isOpen && profile && !profile.onboardingCompleted) {
             setShowOnboardingModal(true); return;
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
              <OnboardingForm userId={currentUser.uid} onComplete={handleOnboardingComplete} />
            </Suspense>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
            <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Coach Recommendations
        </h1>
        {profile && profile.onboardingCompleted && (
            <Button onClick={() => fetchRecommendations(profile)} disabled={isLoadingRecommendations} size="sm">
                {isLoadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                Refresh Recommendations
            </Button>
        )}
      </div>

      {isLoadingRecommendations && <RecommendationsSkeleton />}

      {!isLoadingRecommendations && error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error Generating Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoadingRecommendations && !error && recommendations && (
        <div className="space-y-6">
          {recommendations.fallback && (
             <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                <Wand2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="font-semibold">Using General Advice</AlertTitle>
                <AlertDescription>
                    {recommendations.overallStrategyStatement || "The AI coach is currently providing general study advice. For fully personalized recommendations based on your complete profile, please ensure all profile sections are filled and try refreshing. If this persists, the AI might be under heavy load."}
                </AlertDescription>
            </Alert>
          )}

          {!recommendations.fallback && recommendations.overallStrategyStatement && (
            <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary">Your AI Strategy Statement</AlertTitle>
                <AlertDescription className="text-primary-foreground/90 dark:text-primary/90">
                    {recommendations.overallStrategyStatement}
                </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="strategy" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 text-xs sm:text-sm h-auto sm:h-10 mb-4">
              <TabsTrigger value="strategy" className="py-1.5 sm:py-2"><Goal className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Strategy & Goals</TabsTrigger>
              <TabsTrigger value="focus" className="py-1.5 sm:py-2"><TargetIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Study Focus</TabsTrigger>
              <TabsTrigger value="tips" className="py-1.5 sm:py-2"><Zap className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Personalized Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy">
                <Card>
                    <CardHeader><CardTitle>Goals & Milestones</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {recommendations.shortTermGoals && recommendations.shortTermGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-accent"/>Short-Term Goals</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                            {recommendations.shortTermGoals.map((goal, i) => <li key={`stg-${i}`}>{goal.goal} {goal.timeline && `(${goal.timeline})`}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.longTermGoals && recommendations.longTermGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center"><Flag className="mr-2 h-5 w-5 text-accent"/>Long-Term Goals</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                            {recommendations.longTermGoals.map((goal, i) => <li key={`ltg-${i}`}>{goal.goal} {goal.timeline && `(${goal.timeline})`}</li>)}
                            </ul>
                        </div>
                        )}
                         {recommendations.milestoneSuggestions && recommendations.milestoneSuggestions.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center"><TargetIcon className="mr-2 h-5 w-5 text-accent"/>Milestone Suggestions</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                            {recommendations.milestoneSuggestions.map((ms, i) => <li key={`ms-${i}`}>{ms}</li>)}
                            </ul>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="focus">
                <Card>
                    <CardHeader><CardTitle>Study Focus & Cycles</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {recommendations.suggestedWeeklyTimetableFocus && recommendations.suggestedWeeklyTimetableFocus.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-accent"/>Weekly Focus Areas</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                            {recommendations.suggestedWeeklyTimetableFocus.map((focus, i) => <li key={`wfocus-${i}`}>{focus}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.suggestedMonthlyGoals && recommendations.suggestedMonthlyGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-accent"/>Monthly Goals</h3>
                            <ul className="list-disc list-inside space-y-1 pl-2 text-muted-foreground">
                            {recommendations.suggestedMonthlyGoals.map((goal, i) => <li key={`mgoal-${i}`}>{goal}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.studyCycleRecommendation && (
                             <div className="pt-2">
                                <h3 className="font-semibold mb-1 flex items-center"><Clock className="mr-2 h-5 w-5 text-accent"/>Study Cycle Recommendation</h3>
                                <p className="text-muted-foreground pl-2">{recommendations.studyCycleRecommendation}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="tips">
                <Card>
                    <CardHeader><CardTitle>Personalized Tips</CardTitle></CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {recommendations.personalizedTips.timeManagement && recommendations.personalizedTips.timeManagement.length > 0 && (
                                <AccordionItem value="time">
                                <AccordionTrigger className="text-base"><Clock className="mr-2 h-4 w-4 text-primary"/>Time Management</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    {recommendations.personalizedTips.timeManagement.map((tip, i) => <li key={`time-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.subjectSpecificStudy && recommendations.personalizedTips.subjectSpecificStudy.length > 0 && (
                                <AccordionItem value="subject">
                                <AccordionTrigger className="text-base"><ListChecks className="mr-2 h-4 w-4 text-primary"/>Subject-Specific Study</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    {recommendations.personalizedTips.subjectSpecificStudy.map((tip, i) => <li key={`subject-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.motivationalNudges && recommendations.personalizedTips.motivationalNudges.length > 0 && (
                                <AccordionItem value="motivation">
                                <AccordionTrigger className="text-base"><Zap className="mr-2 h-4 w-4 text-primary"/>Motivational Nudges</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    {recommendations.personalizedTips.motivationalNudges.map((tip, i) => <li key={`motivation-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.focusAndDistraction && recommendations.personalizedTips.focusAndDistraction.length > 0 && (
                                <AccordionItem value="focus">
                                <AccordionTrigger className="text-base"><ShieldCheck className="mr-2 h-4 w-4 text-primary"/>Focus & Distraction</AccordionTrigger>
                                <AccordionContent>
                                    <ul className="list-disc list-inside space-y-1 pl-4 text-muted-foreground">
                                    {recommendations.personalizedTips.focusAndDistraction.map((tip, i) => <li key={`focus-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                        </Accordion>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!isLoadingRecommendations && !error && !recommendations && profile && profile.onboardingCompleted && (
         <Card>
            <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Click "Refresh Recommendations" to get your personalized AI coaching insights.</p>
            </CardContent>
         </Card>
      )}
       {!isLoadingRecommendations && !profile && (
         <Card>
            <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please log in to access AI Coach recommendations.</p>
                <Button asChild className="mt-4"><Link href="/login">Log In</Link></Button>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
