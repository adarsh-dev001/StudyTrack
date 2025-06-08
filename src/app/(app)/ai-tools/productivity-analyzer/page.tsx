
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Lightbulb, Zap, Brain, Award, TrendingUp, Rocket, Target as TargetIcon, Lock, Info } from 'lucide-react';
import { analyzeProductivityData, type AnalyzeProductivityDataInput, type AnalyzeProductivityDataOutput } from '@/ai/flows/analyze-productivity-data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { getUnlockAndProgressStatus, type UnlockStatus } from '@/lib/activity-utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { db } from '@/lib/firebase'; 
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'; 
import type { UserProfileData } from '@/lib/profile-types'; 
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';


const productivityAnalyzerFormSchema = z.object({
  studyHours: z.coerce.number().min(0, { message: 'Study hours cannot be negative.' }).max(100, { message: 'Study hours seem too high for a week.' }),
  topicsCompleted: z.coerce.number().min(0, { message: 'Topics completed cannot be negative.' }),
  subjectPhysicsHours: z.coerce.number().min(0).optional(),
  subjectChemistryHours: z.coerce.number().min(0).optional(),
  subjectBiologyHours: z.coerce.number().min(0).optional(),
  subjectMathHours: z.coerce.number().min(0).optional(),
  subjectOtherHours: z.coerce.number().min(0).optional(),
  streakLength: z.coerce.number().min(0, { message: 'Streak length cannot be negative.' }),
  weeklyGoalsCompleted: z.coerce.number().min(0, { message: 'Weekly goals completed cannot be negative.' }),
});

type ProductivityAnalyzerFormData = z.infer<typeof productivityAnalyzerFormSchema>;

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


export default function ProductivityAnalyzerPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [analysisResult, setAnalysisResult] = useState<AnalyzeProductivityDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null); // Added to store full profile
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  
  const [unlockState, setUnlockState] = useState<UnlockStatus | null>(null);
  const [isLoadingUnlockStatus, setIsLoadingUnlockStatus] = useState(true); 
  const [hasShownUnlockToast, setHasShownUnlockToast] = useState(false);


  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserProfile(data); // Store full profile
          if (!data.onboardingCompleted) {
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

  const handleOnboardingSuccess = () => {
    setShowOnboardingModal(false);
  };


  useEffect(() => {
    if (!userProfile?.onboardingCompleted || !currentUser?.uid) { // Check userProfile state
      setIsLoadingUnlockStatus(false); 
      return;
    }

    setIsLoadingUnlockStatus(true);
    getUnlockAndProgressStatus(currentUser.uid).then(status => {
      const previouslyLocked = unlockState ? !unlockState.unlocked : true;
      setUnlockState(status);
      if (status.unlocked && previouslyLocked && !hasShownUnlockToast) {
        toast({
          title: '🎉 Productivity Analysis AI Unlocked! 🎉',
          description: "You've gained access to your personal productivity coach!",
        });
        setHasShownUnlockToast(true);
      }
      setIsLoadingUnlockStatus(false);
    });
  }, [currentUser?.uid, toast, hasShownUnlockToast, unlockState, userProfile?.onboardingCompleted]); 

  const form = useForm<ProductivityAnalyzerFormData>({
    resolver: zodResolver(productivityAnalyzerFormSchema),
    defaultValues: {
      studyHours: 0,
      topicsCompleted: 0,
      subjectPhysicsHours: 0,
      subjectChemistryHours: 0,
      subjectBiologyHours: 0,
      subjectMathHours: 0,
      subjectOtherHours: 0,
      streakLength: 0,
      weeklyGoalsCompleted: 0,
    },
  });

  const onSubmit: SubmitHandler<ProductivityAnalyzerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);

    const subjectWiseTimeDistribution: Record<string, number> = {};
    if (data.subjectPhysicsHours && data.subjectPhysicsHours > 0) subjectWiseTimeDistribution['Physics'] = data.subjectPhysicsHours;
    if (data.subjectChemistryHours && data.subjectChemistryHours > 0) subjectWiseTimeDistribution['Chemistry'] = data.subjectChemistryHours;
    if (data.subjectBiologyHours && data.subjectBiologyHours > 0) subjectWiseTimeDistribution['Biology'] = data.subjectBiologyHours;
    if (data.subjectMathHours && data.subjectMathHours > 0) subjectWiseTimeDistribution['Mathematics'] = data.subjectMathHours;
    if (data.subjectOtherHours && data.subjectOtherHours > 0) subjectWiseTimeDistribution['Other'] = data.subjectOtherHours;
    
    const inputForAI: AnalyzeProductivityDataInput = {
      studyHours: data.studyHours,
      topicsCompleted: data.topicsCompleted,
      subjectWiseTimeDistribution,
      streakLength: data.streakLength,
      weeklyGoalsCompleted: data.weeklyGoalsCompleted,
    };

    try {
      const result: AnalyzeProductivityDataOutput = await analyzeProductivityData(inputForAI);
      setAnalysisResult(result);
      toast({
        title: 'Analysis Complete! 📊',
        description: 'Your productivity insights are ready.',
      });
    } catch (error: any) {
      console.error('Error analyzing productivity data:', error);
      setAnalysisResult(null);
      toast({
        title: 'Error Analyzing Data 😥',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking profile status...</p>
      </div>
    );
  }

  if (showOnboardingModal && currentUser) {
     return (
      <Dialog open={showOnboardingModal} onOpenChange={(isOpen) => {
          if (!currentUser) return;
          if (!isOpen && userProfile && !userProfile.onboardingCompleted) {
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
                <OnboardingForm userId={currentUser.uid} onComplete={handleOnboardingSuccess} />
             </Suspense>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!userProfile?.onboardingCompleted && !isLoadingProfile && currentUser) { 
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
            <p className="text-muted-foreground">Please complete your profile to access the Productivity Analyzer.</p>
        </div>
     );
  }
  
  if (isLoadingUnlockStatus || !unlockState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Checking access to AI Analyzer...</p>
      </div>
    );
  }

  if (!unlockState.unlocked) {
    return (
      <div className="w-full space-y-6 flex flex-col items-center justify-center p-4">
        <Card className="shadow-xl w-full max-w-lg text-center border-primary/30 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="p-6">
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-3">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">Productivity Analysis AI Locked</CardTitle>
            <CardDescription className="text-sm sm:text-md text-muted-foreground mt-1">
              🎯 “Complete your 7-day activity streak (study or daily platform use) to unlock your personal productivity coach. Let’s break down how you're studying and help you improve!”
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-muted-foreground">Progress:</span>
                <span className="font-medium text-primary">{unlockState.message}</span>
              </div>
              <Progress value={(unlockState.displayProgress / unlockState.progressTarget) * 100} className="h-3" />
            </div>
            <p className="text-xs text-muted-foreground">
                Current Study Streak: <strong>{unlockState.studyStreakCount} days</strong>.
                Consecutive Interaction Days: <strong>{unlockState.interactionStreakCount} days</strong>.
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <Info className="mr-1.5 h-3.5 w-3.5" /> How to Unlock & Learn More
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-primary" /> Unlock Your AI Productivity Coach
                  </DialogTitle>
                  <DialogDescription className="text-sm text-left pt-2 space-y-1">
                    This powerful AI tool analyzes your study patterns to provide personalized insights and recommendations.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-2 text-sm space-y-3">
                  <p><strong className="text-foreground">What it does:</strong> Identifies your strong/weak subjects, detects burnout signs, and offers actionable tips for time management and study efficiency.</p>
                  <p><strong className="text-foreground">Unlock Conditions:</strong></p>
                  <ul className="list-disc list-inside pl-4 space-y-1 text-muted-foreground">
                    <li>Achieve a <strong className="text-foreground">7-day study streak</strong> by checking in daily.</li>
                    <li>OR, interact with StudyTrack (complete Pomodoros, tasks, or quizzes) for <strong className="text-foreground">7 consecutive days</strong>.</li>
                  </ul>
                  <p className="text-foreground font-medium pt-1">Keep up the great work, you're almost there!</p>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Productivity Analysis AI
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Input your weekly study data to get AI-driven insights and recommendations. 📈
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Your Weekly Study Data 🗓️</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Provide your study metrics for the past week to get AI feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                <FormField
                  control={form.control}
                  name="studyHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Total Study Hours (Weekly) ⏳</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 20" {...field} value={isNaN(field.value as number) ? '' : field.value} className="text-sm sm:text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topicsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Total Topics Completed (Weekly) ✅</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} value={isNaN(field.value as number) ? '' : field.value} className="text-sm sm:text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Card className="border-border/70 bg-muted/30">
                <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 px-3 sm:px-4">
                    <CardTitle className="text-md sm:text-lg">Subject-wise Time Distribution (Hours) 📚</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Enter hours spent on each subject this week. Leave blank or 0 if not applicable.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 sm:gap-x-4 gap-y-2 sm:gap-y-3 p-3 sm:p-4">
                    <FormField control={form.control} name="subjectPhysicsHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs sm:text-sm">Physics</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} value={isNaN(field.value as number) ? '' : field.value || ''} className="text-xs sm:text-sm h-9 sm:h-10"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectChemistryHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs sm:text-sm">Chemistry</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} value={isNaN(field.value as number) ? '' : field.value || ''} className="text-xs sm:text-sm h-9 sm:h-10"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectBiologyHours" render={({ field }) => (
                       <FormItem><FormLabel className="text-xs sm:text-sm">Biology</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} value={isNaN(field.value as number) ? '' : field.value || ''} className="text-xs sm:text-sm h-9 sm:h-10"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectMathHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs sm:text-sm">Mathematics</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} value={isNaN(field.value as number) ? '' : field.value || ''} className="text-xs sm:text-sm h-9 sm:h-10"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectOtherHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs sm:text-sm">Other Subjects</FormLabel><FormControl><Input type="number" placeholder="e.g., 2" {...field} value={isNaN(field.value as number) ? '' : field.value || ''} className="text-xs sm:text-sm h-9 sm:h-10"/></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
                <FormField
                  control={form.control}
                  name="streakLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Current Study Streak (Days) 🔥</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} value={isNaN(field.value as number) ? '' : field.value} className="text-sm sm:text-base"/>
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">How many consecutive days have you studied?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyGoalsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Weekly Goals Completed 🎯</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 3 of 5" {...field} value={isNaN(field.value as number) ? '' : field.value} className="text-sm sm:text-base"/>
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">How many of your set weekly goals did you achieve?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" disabled={isLoading} size="default" className="w-full sm:w-auto text-sm sm:text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Get AI Insights
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-headline text-primary flex items-center">
                <Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> 🚀 Your AI Productivity Analysis!
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Here's what the AI thinks about your study habits this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="p-3 sm:p-4 bg-secondary/40 rounded-lg border border-border">
              <h3 className="font-semibold text-lg sm:text-xl mb-1.5 sm:mb-2 text-foreground flex items-center">
                <Award className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> Overall Assessment Snapshot:
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{analysisResult.overallAssessment}</p>
            </div>
            
            {analysisResult.insights && analysisResult.insights.length > 0 && (
              <div className="p-3 sm:p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground flex items-center">
                  <Lightbulb className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400" /> Personalized Insights Unlocked:
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {analysisResult.insights.map((insight, index) => (
                    <li key={`insight-${index}`} className="py-0.5 sm:py-1 flex items-start">
                        <TrendingUp className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="p-3 sm:p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground flex items-center">
                  <Rocket className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400" /> Your Action Plan for Success:
                </h3>
                <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="py-0.5 sm:py-1 flex items-start">
                        <TargetIcon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
           <CardFooter className="pt-4 sm:pt-6 border-t mt-4 sm:mt-6 bg-secondary/20 rounded-b-lg p-4 sm:p-6">
            <p className="text-sm sm:text-md text-center w-full text-accent-foreground/90 font-semibold">
                🙌 Keep crushing those goals! Small improvements lead to big wins. You're on the path to success!
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

