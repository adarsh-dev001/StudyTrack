
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
    Target as TargetIcon, Zap, LineChart, Brain, UserCheck, ListChecks, Repeat, Flag, Rocket, CheckCircle, MessagesSquare
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import OnboardingRequiredGate from '@/components/onboarding/OnboardingRequiredGate'; // Import the gate

interface ProgressStep {
  text: string;
  icon: LucideIcon;
}

const progressSteps: ProgressStep[] = [
  { text: "Analyzing your exam, subjects & focus patterns…", icon: Brain },
  { text: "Considering your study habits & learning styles…", icon: UserCheck },
  { text: "Matching with latest syllabus & deadlines…", icon: ListChecks },
  { text: "Building study–break cycles that work for you…", icon: Repeat },
  { text: "Setting personalized goals & checkpoints…", icon: TargetIcon },
  { text: "Finalizing your AI-powered plan…", icon: Rocket },
];

const motivationalTips = [
  "💡 Every expert was once a beginner. Keep pushing!",
  "📆 Small daily improvements lead to big results. Consistency is key.",
  "🔁 Active recall is more effective than passive re-reading. Test yourself!",
  "🧘 Protect your focus. Minimize distractions during study blocks.",
  "🎯 Set clear, achievable goals for each study session."
];


export default function AiRecommendationsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);


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
          setOnboardingCompleted(false);
          setProfile(null);
          setIsLoadingProfile(false);
          return;
        }
        setOnboardingCompleted(true);

        const userProfileData = profileSnap.data() as UserProfileData;
        setProfile(userProfileData);
        

        // Map all relevant UserProfileData fields to PersonalizedRecommendationsInput
        const aiInput: PersonalizedRecommendationsInput = {
          name: userProfileData.fullName || currentUser.displayName || undefined,
          targetExams: userProfileData.targetExams,
          otherExamName: userProfileData.otherExamName,
          examAttemptYear: userProfileData.examAttemptYear,
          languageMedium: userProfileData.languageMedium,
          studyMode: userProfileData.studyMode,
          examPhase: userProfileData.examPhase,
          previousAttempts: userProfileData.previousAttempts,
          dailyStudyHours: userProfileData.dailyStudyHours,
          preferredStudyTime: userProfileData.preferredStudyTime,
          weakSubjects: userProfileData.weakSubjects, 
          strongSubjects: userProfileData.strongSubjects, 
          subjectDetails: userProfileData.subjectDetails, 
          preferredLearningStyles: userProfileData.preferredLearningStyles, 
          motivationType: userProfileData.motivationType,
          age: userProfileData.age,
          location: userProfileData.location,
          distractionStruggles: userProfileData.distractionStruggles,
        };
        
        setIsLoadingProfile(false); // Profile loaded, now load recommendations

        setIsLoadingRecommendations(true);
        setError(null);
        setCurrentProgressStepIndex(0);
        setCurrentTipIndex(0);
        
        const aiOutput = await generatePersonalizedRecommendations(aiInput);
        
        if (aiOutput.fallback) {
            setError("⚠️ AI is currently overloaded. Please try again shortly for personalized recommendations.");
            setRecommendations(null); 
        } else {
            setRecommendations(aiOutput);
        }

      } catch (err: any) {
        console.error("Error fetching profile or generating recommendations:", err);
        setError(err.message || "An error occurred while generating recommendations.");
        setRecommendations(null);
      } finally {
        // Ensure both loading states are false regardless of path
        setIsLoadingProfile(false); 
        setIsLoadingRecommendations(false);
      }
    }

    fetchProfileAndGenerateRecommendations();
  }, [currentUser?.uid, currentUser?.displayName]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (isLoadingRecommendations) {
      progressInterval = setInterval(() => {
        setCurrentProgressStepIndex(prevIndex => {
            const nextIndex = prevIndex + 1;
            return nextIndex >= progressSteps.length ? progressSteps.length -1 : nextIndex;
        });
      }, 1500); 
    }
    return () => clearInterval(progressInterval);
  }, [isLoadingRecommendations]);

  useEffect(() => {
    let tipInterval: NodeJS.Timeout;
    if (isLoadingRecommendations) {
      tipInterval = setInterval(() => {
        setCurrentTipIndex(prevIndex => (prevIndex + 1) % motivationalTips.length);
      }, 3000); 
    }
    return () => clearInterval(tipInterval);
  }, [isLoadingRecommendations]);


  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile and recommendations settings...</p>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <OnboardingRequiredGate featureName="AI Personalized Recommendations" />;
  }

  if (isLoadingRecommendations) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-4 sm:p-6 space-y-6 sm:space-y-8">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-2 sm:mb-3" />
        <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                🎓✨ Hold on, we’re crafting your perfect study journey...
            </h1>
            <p className="text-md sm:text-lg text-muted-foreground max-w-lg sm:max-w-xl">
                Based on your detailed profile, we’re building a truly customized timetable, goal tracker, and focus plan just for your exam prep!
            </p>
        </div>

        <div className="w-full max-w-md space-y-2.5 sm:space-y-3">
            {progressSteps.map((step, index) => {
                const IconComponent = step.icon;
                const isCompleted = index < currentProgressStepIndex;
                const isActive = index === currentProgressStepIndex;

                return (
                 <div
                    key={step.text}
                    className={`flex items-center p-2.5 sm:p-3 rounded-lg transition-all duration-500 ease-in-out text-xs sm:text-sm
                                ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}
                                ${isActive ? 'bg-primary/10 scale-105 shadow-md' :
                                 isCompleted ? 'bg-green-500/10 text-green-700 dark:text-green-300' :
                                 'bg-muted/50'}`}
                >
                    {isCompleted ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 shrink-0" />
                    ) : (
                        <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 shrink-0 ${isActive ? 'text-primary' : 'text-primary'}`} />
                    )}
                    <span className={`font-medium ${
                        isActive ? 'text-primary dark:text-primary-foreground' : 
                        isCompleted ? 'text-green-700 dark:text-green-300' :
                        'text-muted-foreground'}`}
                    >
                        {step.text}
                    </span>
                </div>
            )})}
        </div>

        <Card className="w-full max-w-md bg-accent/10 border-accent/30 shadow-sm">
            <CardContent className="pt-4 sm:pt-5">
                <p className="text-sm sm:text-md font-medium text-accent-foreground text-center">
                    {motivationalTips[currentTipIndex]}
                </p>
            </CardContent>
        </Card>
         <div className="mt-4 sm:mt-6">
            <Button
            disabled
            className="bg-primary/80 text-primary-foreground px-5 sm:px-6 py-2 rounded-full font-semibold shadow-lg transition cursor-not-allowed text-sm sm:text-base"
            size="lg"
            >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Plan...
            </Button>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-muted-foreground">Please wait a few seconds…</p>
        </div>
      </div>
    );
  }


  if (error && !isLoadingRecommendations) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Alert variant={error.startsWith("⚠️") ? "default" : "destructive"} className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>{error.startsWith("⚠️") ? "Service Information" : "Error"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (!profile && !isLoadingProfile && !error && onboardingCompleted) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Alert className="max-w-md">
          <Lightbulb className="h-5 w-5" />
          <AlertTitle>Profile Data Issue</AlertTitle>
          <AlertDescription>
            Your onboarding is complete, but we couldn't load your profile data for recommendations. Please try again or contact support.
          </AlertDescription>
        </Alert>
        <Button asChild className="mt-6" variant="outline">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    );
  }


  return (
    <ScrollArea className="h-[calc(100vh-100px)]">
    <div className="w-full space-y-6 sm:space-y-8 p-2 md:p-4 lg:p-6">
      <header className="space-y-1.5 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Your AI Study Blueprint
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Personalized recommendations for {profile?.fullName || 'you'} to help ace your {profile?.targetExams?.map(exam => profile.otherExamName && exam === 'other' ? profile.otherExamName : exam).join(', ') || 'exams'}!
          This plan is AI-generated; adapt it to your needs and always cross-verify critical information.
        </p>
      </header>

      {!isLoadingRecommendations && recommendations && (
        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl flex items-center"><Zap className="mr-2 h-5 w-5 text-accent" />Overall Strategy</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">{recommendations.overallStrategyStatement}</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-md sm:text-lg flex items-center"><BookOpen className="mr-2 h-5 w-5 text-primary" /> Weekly Focus</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Key areas for your typical study week.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="list-disc list-inside space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  {recommendations.suggestedWeeklyTimetableFocus.map((item, idx) => <li key={`weekly-${idx}`}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-md sm:text-lg flex items-center"><CheckSquare className="mr-2 h-5 w-5 text-primary" /> Monthly Goals</CardTitle>
                <CardDescription className="text-xs sm:text-sm">High-level objectives for the month.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                 <ul className="list-disc list-inside space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  {recommendations.suggestedMonthlyGoals.map((item, idx) => <li key={`monthly-${idx}`}>{item}</li>)}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-md sm:text-lg flex items-center"><Clock className="mr-2 h-5 w-5 text-primary" /> Study Cycle Suggestion</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-sm sm:text-md font-medium text-foreground">{recommendations.studyCycleRecommendation}</p>
                <p className="text-xs text-muted-foreground mt-1">Adjust based on your energy levels and task difficulty.</p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-md sm:text-lg flex items-center"><TargetIcon className="mr-2 h-5 w-5 text-primary" /> Short-Term Goals</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                  {recommendations.shortTermGoals.map((goal, idx) => (
                    <li key={`stg-${idx}`} className="p-2 border-l-2 border-accent pl-2.5 sm:pl-3 bg-accent/10 rounded-r-md">
                      <p className="font-medium text-accent-foreground">{goal.goal}</p>
                      {goal.timeline && <p className="text-xs text-muted-foreground">Timeline: {goal.timeline}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
             <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-md sm:text-lg flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary" /> Long-Term Goals</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
                  {recommendations.longTermGoals.map((goal, idx) => (
                     <li key={`ltg-${idx}`} className="p-2 border-l-2 border-primary pl-2.5 sm:pl-3 bg-primary/10 rounded-r-md">
                      <p className="font-medium text-primary-foreground">{goal.goal}</p>
                      {goal.timeline && <p className="text-xs text-muted-foreground">Timeline: {goal.timeline}</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-md sm:text-lg flex items-center"><Flag className="mr-2 h-5 w-5 text-primary" /> Milestone Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ul className="list-disc list-inside space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                {recommendations.milestoneSuggestions.map((item, idx) => <li key={`milestone-${idx}`}>{item}</li>)}
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-400" /> Personalized Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div>
                <h4 className="font-semibold text-sm sm:text-md text-foreground mb-1">Time Management:</h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4">
                  {recommendations.personalizedTips.timeManagement.map((tip, idx) => <li key={`tm-${idx}`}>{tip}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-md text-foreground mb-1">Subject-Specific Study:</h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4">
                  {recommendations.personalizedTips.subjectSpecificStudy.map((tip, idx) => <li key={`ss-${idx}`}>{tip}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm sm:text-md text-foreground mb-1">Motivational Nudges:</h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4">
                  {recommendations.personalizedTips.motivationalNudges.map((tip, idx) => <li key={`mn-${idx}`}>{tip}</li>)}
                </ul>
              </div>
               <div>
                <h4 className="font-semibold text-sm sm:text-md text-foreground mb-1 flex items-center">
                    <MessagesSquare className="mr-1.5 h-4 w-4 text-sky-500" /> Focus & Distraction Management:
                </h4>
                <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-muted-foreground pl-3 sm:pl-4">
                  {recommendations.personalizedTips.focusAndDistraction.map((tip, idx) => <li key={`fd-${idx}`}>{tip}</li>)}
                </ul>
              </div>
            </CardContent>
          </Card>
           <div className="text-center pt-3 sm:pt-4">
                <Button asChild size="lg" className="text-sm sm:text-base">
                    <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
      )}

       {!isLoadingProfile && !isLoadingRecommendations && !recommendations && !error && profile && onboardingCompleted && (
         <div className="flex flex-col items-center justify-center min-h-[calc(100vh-300px)] text-center p-6">
            <Alert className="max-w-md">
              <Lightbulb className="h-5 w-5" />
              <AlertTitle>Ready for Your Plan!</AlertTitle>
              <AlertDescription>
                We have your profile. If recommendations didn't load, try refreshing or check back shortly. The AI might be busy.
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
