
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Lightbulb, BookOpen, CheckSquare, Award, Clock, Target as TargetIcon, Zap, LineChart, Brain } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AiRecommendationsPage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendationsOutput | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        // Prepare input for AI Flow
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

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your profile...</p>
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
          <AlertTitle>Profile Not Found</AlertTitle>
          <AlertDescription>
            We couldn't find your profile information. Please ensure you've completed the onboarding process.
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
        </p>
         {isLoadingRecommendations && (
          <div className="flex items-center text-primary pt-3">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Generating your personalized plan... this may take a moment.</span>
          </div>
        )}
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
      
      {/* Placeholder for if recommendations are null and not loading and no error */}
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

    