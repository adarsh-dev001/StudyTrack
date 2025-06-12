'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Unsubscribe, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import {
  generatePersonalizedRecommendations,
  type PersonalizedRecommendationsOutput,
  type PersonalizedRecommendationsInput,
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
import Link from 'next/link';
import OnboardingGate from '@/components/onboarding/onboarding-gate';
import { useToast } from '@/components/ui/use-toast';

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
      <div className="space-y-6 sm:space-y-8">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-5/6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 sm:p-6">
             <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
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
          <CardHeader className="p-4 sm:p-6">
             <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isInputFormCollapsed, setIsInputFormCollapsed] = useState(false);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const fetchRecommendations = useCallback(async (userProfile: UserProfileData) => {
    setIsLoadingRecommendations(true);
    setError(null);
    try {
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
      const AImessage = (err instanceof Error && err.message) ? err.message : "An unexpected error occurred with the AI service.";
      setError(`Failed to generate recommendations. ${AImessage} Please try refreshing. If the issue persists, the AI might be under heavy load or experiencing temporary issues.`);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setProfile(data);
        } else {
          setProfile(null);
        }
        setIsLoadingProfile(false);
      }, (err) => {
        console.error("Error fetching profile:", err);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
        setIsLoadingProfile(false);
      });
    } else {
      setIsLoadingProfile(false);
    }
    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [currentUser?.uid, toast]);

  const handleOnboardingComplete = async () => { 
    setShowOnboardingModal(false);
    if(currentUser?.uid) {
        const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
        try {
            const profileSnap = await getDoc(profileDocRef); 
            if (profileSnap.exists()) {
                const userProfileData = profileSnap.data() as UserProfileData;
                setProfile(userProfileData);
                if (userProfileData.onboardingCompleted && !recommendations && !isLoadingRecommendations && !error) {
                    fetchRecommendations(userProfileData);
                }
            }
        } catch (err) {
            console.error("Error re-fetching profile after onboarding:", err);
            setError("Could not reload profile after onboarding.");
        }
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading AI Recommendations...</p>
      </div>
    );
  }

  if (!profile?.hasCompletedOnboarding) {
    return <OnboardingGate featureName="AI Recommendations" hasPaid={profile?.hasPaid || false} />;
  }

  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem' },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem' }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
            <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Coach Recommendations
        </h1>
        {profile && profile.onboardingCompleted && (
            <Button onClick={() => profile && fetchRecommendations(profile)} disabled={isLoadingRecommendations} size="sm" className="py-2 px-3 self-start sm:self-center">
                {isLoadingRecommendations ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Wand2 className="mr-2 h-4 w-4" />}
                Refresh Recommendations
            </Button>
        )}
      </div>

      {isLoadingRecommendations && <RecommendationsSkeleton />}

      {!isLoadingRecommendations && error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-destructive text-lg sm:text-xl">Error Generating Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-destructive-foreground text-sm sm:text-base leading-relaxed">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoadingRecommendations && !error && recommendations && (
        <div className="space-y-6 sm:space-y-8">
          {recommendations.fallback && (
             <Alert variant="default" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300">
                <Wand2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="font-semibold text-base sm:text-lg text-amber-800 dark:text-amber-200">Using General Advice</AlertTitle>
                <AlertDescription className="text-sm sm:text-base leading-relaxed text-amber-700/90 dark:text-amber-300/90">
                    {recommendations.overallStrategyStatement || "The AI coach is currently providing general study advice. For fully personalized recommendations based on your complete profile, please ensure all profile sections are filled and try refreshing. If this persists, the AI might be under heavy load."}
                </AlertDescription>
            </Alert>
          )}

          {!recommendations.fallback && recommendations.overallStrategyStatement && (
            <Alert variant="default" className="bg-primary/10 border-primary/30">
                <Lightbulb className="h-5 w-5 text-primary" />
                <AlertTitle className="font-semibold text-primary text-base sm:text-lg">Your AI Strategy Statement</AlertTitle>
                <AlertDescription className="text-sm sm:text-base leading-relaxed text-foreground/80 dark:text-primary-foreground/80">
                    {recommendations.overallStrategyStatement}
                </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="strategy" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 text-xs sm:text-sm h-auto rounded-lg shadow-sm bg-muted p-1">
              <TabsTrigger value="strategy" className="py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md"><Goal className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Strategy & Goals</TabsTrigger>
              <TabsTrigger value="focus" className="py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md"><TargetIcon className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Study Focus</TabsTrigger>
              <TabsTrigger value="tips" className="py-2 sm:py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-md"><Zap className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Personalized Tips</TabsTrigger>
            </TabsList>

            <TabsContent value="strategy" className="mt-4">
                <Card>
                    <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Goals & Milestones</CardTitle></CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                        {recommendations.shortTermGoals && recommendations.shortTermGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-base sm:text-lg flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-accent"/>Short-Term Goals</h3>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {recommendations.shortTermGoals.map((goal, i) => <li key={`stg-${i}`}>{goal.goal} {goal.timeline && `(${goal.timeline})`}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.longTermGoals && recommendations.longTermGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-base sm:text-lg flex items-center"><Flag className="mr-2 h-5 w-5 text-accent"/>Long-Term Goals</h3>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {recommendations.longTermGoals.map((goal, i) => <li key={`ltg-${i}`}>{goal.goal} {goal.timeline && `(${goal.timeline})`}</li>)}
                            </ul>
                        </div>
                        )}
                         {recommendations.milestoneSuggestions && recommendations.milestoneSuggestions.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-base sm:text-lg flex items-center"><TargetIcon className="mr-2 h-5 w-5 text-accent"/>Milestone Suggestions</h3>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {recommendations.milestoneSuggestions.map((ms, i) => <li key={`ms-${i}`}>{ms}</li>)}
                            </ul>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="focus" className="mt-4">
                <Card>
                    <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Study Focus & Cycles</CardTitle></CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                        {recommendations.suggestedWeeklyTimetableFocus && recommendations.suggestedWeeklyTimetableFocus.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-base sm:text-lg flex items-center"><ListChecks className="mr-2 h-5 w-5 text-accent"/>Weekly Focus Areas</h3>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {recommendations.suggestedWeeklyTimetableFocus.map((focus, i) => <li key={`wfocus-${i}`}>{focus}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.suggestedMonthlyGoals && recommendations.suggestedMonthlyGoals.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2 text-base sm:text-lg flex items-center"><CalendarClock className="mr-2 h-5 w-5 text-accent"/>Monthly Goals</h3>
                            <ul className="list-disc list-inside space-y-1.5 pl-2 text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {recommendations.suggestedMonthlyGoals.map((goal, i) => <li key={`mgoal-${i}`}>{goal}</li>)}
                            </ul>
                        </div>
                        )}
                        {recommendations.studyCycleRecommendation && (
                             <div className="pt-2">
                                <h3 className="font-semibold mb-1 text-base sm:text-lg flex items-center"><Clock className="mr-2 h-5 w-5 text-accent"/>Study Cycle Recommendation</h3>
                                <p className="text-muted-foreground pl-2 text-sm sm:text-base leading-relaxed">{recommendations.studyCycleRecommendation}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="tips" className="mt-4">
                <Card>
                    <CardHeader className="p-4 sm:p-6"><CardTitle className="text-lg sm:text-xl">Personalized Tips</CardTitle></CardHeader>
                    <CardContent className="p-4 sm:p-6">
                        <Accordion type="single" collapsible className="w-full" defaultValue="time">
                            {recommendations.personalizedTips.timeManagement && recommendations.personalizedTips.timeManagement.length > 0 && (
                                <AccordionItem value="time">
                                <AccordionTrigger className="text-base sm:text-lg py-3"><Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Time Management</AccordionTrigger>
                                <AccordionContent className="pt-2 pb-3">
                                    <ul className="list-disc list-inside space-y-1.5 pl-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    {recommendations.personalizedTips.timeManagement.map((tip, i) => <li key={`time-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.subjectSpecificStudy && recommendations.personalizedTips.subjectSpecificStudy.length > 0 && (
                                <AccordionItem value="subject">
                                <AccordionTrigger className="text-base sm:text-lg py-3"><ListChecks className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Subject-Specific Study</AccordionTrigger>
                                <AccordionContent className="pt-2 pb-3">
                                    <ul className="list-disc list-inside space-y-1.5 pl-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    {recommendations.personalizedTips.subjectSpecificStudy.map((tip, i) => <li key={`subject-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.motivationalNudges && recommendations.personalizedTips.motivationalNudges.length > 0 && (
                                <AccordionItem value="motivation">
                                <AccordionTrigger className="text-base sm:text-lg py-3"><Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Motivational Nudges</AccordionTrigger>
                                <AccordionContent className="pt-2 pb-3">
                                    <ul className="list-disc list-inside space-y-1.5 pl-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                                    {recommendations.personalizedTips.motivationalNudges.map((tip, i) => <li key={`motivation-${i}`}>{tip}</li>)}
                                    </ul>
                                </AccordionContent>
                                </AccordionItem>
                            )}
                            {recommendations.personalizedTips.focusAndDistraction && recommendations.personalizedTips.focusAndDistraction.length > 0 && (
                                <AccordionItem value="focus" className="border-b-0">
                                <AccordionTrigger className="text-base sm:text-lg py-3"><ShieldCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary"/>Focus & Distraction</AccordionTrigger>
                                <AccordionContent className="pt-2 pb-3">
                                    <ul className="list-disc list-inside space-y-1.5 pl-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
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
            <CardContent className="pt-6 text-center p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Click "Refresh Recommendations" to get your personalized AI coaching insights.</p>
            </CardContent>
         </Card>
      )}
       {!isLoadingRecommendations && !profile && !currentUser && ( 
         <Card>
            <CardContent className="pt-6 text-center p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">Please log in to access AI Coach recommendations.</p>
                <Button asChild className="mt-4 py-2 px-4"><Link href="/login">Log In</Link></Button>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

