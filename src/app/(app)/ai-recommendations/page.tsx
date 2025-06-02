
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import {
  generatePersonalizedRecommendations,
  type PersonalizedRecommendationsInput,
  type PersonalizedRecommendationsOutput
} from '@/ai/flows/generate-personalized-recommendations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    Loader2, AlertTriangle, Lightbulb, BookOpen, CheckSquare, Award, Clock, 
    Target as TargetIcon, Zap, LineChart, Brain, UserCheck, ListChecks, Repeat, Flag, Rocket, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const progressSteps = [
  { text: "Analyzing your exam, subjects & focus patterns…", icon: <Brain className="h-5 w-5 text-primary mr-2" /> },
  { text: "Matching with latest syllabus & deadlines…", icon: <ListChecks className="h-5 w-5 text-primary mr-2" /> },
  { text: "Building study–break cycles that work for you…", icon: <Repeat className="h-5 w-5 text-primary mr-2" /> },
  { text: "Setting personalized goals & checkpoints…", icon: <TargetIcon className="h-5 w-5 text-primary mr-2" /> },
  { text: "Finalizing your AI-powered plan…", icon: <Rocket className="h-5 w-5 text-primary mr-2" /> },
];

const motivationalTips = [
  "💡 Did you know? Studying 2 hours in deep focus is more effective than 5 hours with distractions.",
  "🎯 Tip: Break big goals into 7-day challenges — it's easier to stay consistent.",
  "🔁 Revise every 3 days — your brain loves repetition.",
  "🧘 Stay calm and focused — your progress is compounding.",
];

export default function AiRecommendationsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentProgressStepIndex, setCurrentProgressStepIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    async function fetchProfileAndGenerateRecommendations() {
      if (!currentUser?.uid) {
        setIsLoadingProfile(false);
        setError("Please log in to get personalized recommendations.");
        return;
      }

      setIsLoadingProfile(true);
      try {
        const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
        const profileSnap = await getDoc(profileDocRef);

        if (!profileSnap.exists() || !profileSnap.data()?.onboardingCompleted) {
          setError("Please complete your profile onboarding to receive personalized recommendations.");
          setProfile(null);
          setIsLoadingProfile(false);
          return;
        }

        const userProfileData = profileSnap.data() as UserProfileData;
        setProfile(userProfileData);
        setIsLoadingProfile(false);

        const aiInput: PersonalizedRecommendationsInput = {
          targetExams: userProfileData.targetExams,
          otherExamName: userProfileData.otherExamName,
          examAttemptYear: userProfileData.examAttemptYear,
          dailyStudyHours: userProfileData.dailyStudyHours,
          preferredStudyTime: userProfileData.preferredStudyTime,
          weakSubjects: userProfileData.weakSubjects,
          strongSubjects: userProfileData.strongSubjects,
          preferredLearningStyles: userProfileData.preferredLearningStyles,
          motivationType: userProfileData.motivationType,
          languageMedium: userProfileData.languageMedium,
          studyMode: userProfileData.studyMode,
          examPhase: userProfileData.examPhase,
        };

        setIsLoadingRecommendations(true);
        setError(null);
        setCurrentProgressStepIndex(0); 
        setCurrentTipIndex(0); 
        const aiOutput = await generatePersonalizedRecommendations(aiInput);
        setRecommendations(aiOutput);
      } catch (err: any) {
        console.error("Error fetching profile or generating recommendations:", err);
        setError(err.message || "An error occurred while generating recommendations.");
        setRecommendations(null);
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingRecommendations(false);
      }
    }

    fetchProfileAndGenerateRecommendations();
  }, [currentUser?.uid]);
  
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isLoadingRecommendations) {
      progressInterval = setInterval(() => {
        setCurrentProgressStepIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            // Stop advancing if it reaches the end of steps, or let it loop if desired
            return nextIndex >= progressSteps.length ? progressSteps.length -1 : nextIndex;
        });
      }, 1500); // Updated interval
    }
    return () => clearInterval(progressInterval);
  }, [isLoadingRecommendations]);

  useEffect(() => {
    let tipInterval: NodeJS.Timeout;
    if (isLoadingRecommendations) {
      tipInterval = setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % motivationalTips.length);
      }, 3000); // Updated interval
    }
    return () => clearInterval(tipInterval);
  }, [isLoadingRecommendations]);


  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }
  
  if (isLoadingRecommendations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6 space-y-8">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-3" />
        <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                🎓✨ Hold on, we’re crafting your perfect study journey...
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
                Based on your profile, we’re building a customized timetable, goal tracker, and focus plan just for your exam prep!
            </p>
        </div>

        <div className="w-full max-w-md space-y-3">
            {progressSteps.map((step, index) => (
                 <div
                    key={step.text}
                    className={`flex items-center p-3 rounded-lg transition-opacity duration-500 ease-in-out 
                                ${index <= currentProgressStepIndex ? 'opacity-100' : 'opacity-40'}
                                ${index === currentProgressStepIndex ? 'bg-primary/10 scale-105 shadow-md' : 
                                 index < currentProgressStepIndex ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 
                                 'bg-muted/50'}`}
                >
                    {index < currentProgressStepIndex ? <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" /> : React.cloneElement(step.icon, { className: "h-5 w-5 text-primary mr-2 shrink-0" })}
                    <span className={`font-medium text-sm ${index === currentProgressStepIndex ? 'text-primary-foreground dark:text-primary' : index < currentProgressStepIndex ? '' : 'text-muted-foreground'}`}>
                        {step.text}
                    </span>
                    {index < currentProgressStepIndex && <CheckCircle className="h-5 w-5 text-green-500 ml-auto shrink-0" />}
                </div>
            ))}
        </div>
        
        <Card className="w-full max-w-md bg-accent/10 border-accent/30 shadow-sm">
            <CardContent className="pt-5">
                <p className="text-md font-medium text-accent-foreground text-center">
                    {motivationalTips[currentTipIndex]}
                </p>
            </CardContent>
        </Card>
         <div className="mt-6">
            <Button
            disabled
            className="bg-primary/80 text-primary-foreground px-6 py-2 rounded-full font-semibold shadow-lg transition opacity-75 cursor-not-allowed"
            size="lg"
            >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Plan...
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">Please wait a few seconds…</p>
        </div>
      </div>
    );
  }


  if (error && !isLoadingRecommendations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }
  
  if (!profile && !isLoadingProfile && !error) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Alert className="max-w-md">
          <Lightbulb className="h-5 w-5" />
          <AlertTitle>Profile Not Found or Incomplete</AlertTitle>
          <AlertDescription>
            We couldn't find your profile information or it's not complete. Please ensure you've completed the onboarding process to get AI recommendations.
          </AlertDescription>
        </Alert>
         <Button asChild className="mt-6 mr-2" variant="default">
          <Link href="/onboarding">Complete Onboarding</Link>
        </Button>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }


  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
    <div className="w-full space-y-8 p-1 md:p-4 lg:p-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-3 h-8 w-8 text-primary" /> Your AI Study Blueprint
        </h1>
        <p className="text-lg text-muted-foreground">
          Personalized recommendations to help you ace your {profile?.targetExams?.join(', ') || 'exams'}!
          This plan is AI-generated; adapt it to your needs and always cross-verify critical information.
        </p>
      </header>

      {!isLoadingRecommendations && recommendations && (
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-accent" />Overall Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{recommendations.overallStrategyStatement}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Weekly Focus</CardTitle>
                <CardDescription>Key areas for your typical study week.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  {recommendations.suggestedWeeklyTimetableFocus.map((item, idx) => <li key={`weekly-${idx}`}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><CheckSquare className="mr-2 h-5 w-5 text-primary" /> Monthly Goals</CardTitle>
                <CardDescription>High-level objectives for the month.</CardDescription>
              </CardHeader>
              <CardContent>
                 <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                  {recommendations.suggestedMonthlyGoals.map((item, idx) => <li key={`monthly-${idx}`}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Study Cycle Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-md font-medium text-foreground">{recommendations.studyCycleRecommendation}</p>
                <p className="text-xs text-muted-foreground mt-1">Adjust based on your energy levels and task difficulty.</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><TargetIcon className="mr-2 h-5 w-5 text-primary" /> Short-Term Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm">
                  {recommendations.shortTermGoals.map((goal, idx) => (
                    <li key={`stg-${idx}`} className="p-2 border-l-2 border-accent pl-3 bg-accent/10 rounded-r-md">
                      <p className="font-medium text-accent-foreground">{goal.goal}</p>
                      {goal.timeline && <p className="text-xs text-muted-foreground">Timeline: {goal.timeline}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary" /> Long-Term Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5 text-sm">
                  {recommendations.longTermGoals.map((goal, idx) => (
                     <li key={`ltg-${idx}`} className="p-2 border-l-2 border-primary pl-3 bg-primary/10 rounded-r-md">
                      <p className="font-medium text-primary-foreground">{goal.goal}</p>
                      {goal.timeline && <p className="text-xs text-muted-foreground">Timeline: {goal.timeline}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center"><Award className="mr-2 h-5 w-5 text-primary" /> Milestone Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground">
                {recommendations.milestoneSuggestions.map((item, idx) => <li key={`milestone-${idx}`}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> Personalized Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-md text-foreground mb-1">Time Management:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
                  {recommendations.personalizedTips.timeManagement.map((tip, idx) => <li key={`tm-${idx}`}>{tip}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-md text-foreground mb-1">Subject-Specific Study:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
                  {recommendations.personalizedTips.subjectSpecificStudy.map((tip, idx) => <li key={`ss-${idx}`}>{tip}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-md text-foreground mb-1">Motivational Nudges:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-4">
                  {recommendations.personalizedTips.motivationalNudges.map((tip, idx) => <li key={`mn-${idx}`}>{tip}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
           <div className="text-center pt-4">
                <Button asChild size="lg">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
      )}
      
       {!isLoadingProfile && !isLoadingRecommendations && !recommendations && !error && profile && (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] text-center p-6">
            <Alert className="max-w-md">
              <Lightbulb className="h-5 w-5" />
              <AlertTitle>Ready for Your Plan!</AlertTitle>
              <AlertDescription>
                We have your profile. If recommendations didn't load, try refreshing or check back shortly.
              </AlertDescription>
            </Alert>
             <Button asChild className="mt-6">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
       )}

    </div>
    </ScrollArea>
  );
}

    