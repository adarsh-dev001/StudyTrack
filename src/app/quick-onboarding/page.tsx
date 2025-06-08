
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore'; // Added Timestamp
import type { UserProfileData } from '@/lib/profile-types'; 
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  answerKey: keyof OnboardingAnswers;
  icon?: React.ElementType;
}

interface OnboardingAnswers {
  targetExam: string;
  strugglingSubject: string;
  studyTimePerDay: string;
}

// Data structure for anonymous profile storage
interface QuickOnboardingDataToStore {
  targetExam?: string;
  otherExamName?: string; // If targetExam is "Other"
  strugglingSubject?: string;
  studyTimePerDay?: string;
  quickOnboardingCompleted: true;
  createdAt: Timestamp;
}


const questions: QuizQuestion[] = [
  { id: 1, text: "What are you preparing for?", options: ["NEET", "JEE", "UPSC", "Class 10 Boards", "Other"], answerKey: 'targetExam' },
  { id: 2, text: "Which subject do you struggle with most?", options: ["Physics", "Chemistry", "Biology", "Math", "History", "None/Other"], answerKey: 'strugglingSubject' },
  { id: 3, text: "How much time can you study per day?", options: ["<1 hr", "1-2 hrs", "2-4 hrs", ">4 hrs"], answerKey: 'studyTimePerDay' },
];

const TOTAL_QUESTIONS = questions.length;
const ANON_USER_ID_KEY = 'anonUserId_studytrack';

export default function QuickOnboardingPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [anonUserId, setAnonUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !initialCheckDone) {
      setInitialCheckDone(true);
      if (currentUser) {
        const checkProfile = async () => {
          const profileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists() && (profileSnap.data()?.onboardingCompleted || profileSnap.data()?.quickOnboardingCompleted)) {
            // router.push('/ai-tools'); // User already onboarded, go to tools
          }
        };
        checkProfile();
      } else {
        // Handle anonymous user ID
        let existingAnonId = localStorage.getItem(ANON_USER_ID_KEY);
        if (!existingAnonId) {
          existingAnonId = uuidv4();
          localStorage.setItem(ANON_USER_ID_KEY, existingAnonId);
        }
        setAnonUserId(existingAnonId);
      }
    }
  }, [currentUser, authLoading, router, initialCheckDone]);


  const handleSelectAnswer = (questionAnswerKey: keyof OnboardingAnswers, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionAnswerKey]: answer }));
  };

  const handleNext = () => {
    if (currentStep < TOTAL_QUESTIONS) {
      if (answers[questions[currentStep - 1].answerKey]) {
        setCurrentStep(prev => prev + 1);
      } else {
        toast({
          title: "Selection Required",
          description: "Please select an answer to proceed.",
          variant: "destructive",
          duration: 2000,
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!answers[questions[currentStep - 1].answerKey]) {
      toast({
        title: "Selection Required",
        description: "Please select an answer for the final question.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    
    const collectedAnswers: Partial<QuickOnboardingDataToStore> = {
        quickOnboardingCompleted: true,
        createdAt: Timestamp.now(),
    };
    if (answers.targetExam) collectedAnswers.targetExam = answers.targetExam;
    if (answers.targetExam === "Other") collectedAnswers.otherExamName = "User Specified"; // Simplified for now
    if (answers.strugglingSubject && answers.strugglingSubject !== "None/Other") collectedAnswers.strugglingSubject = answers.strugglingSubject;
    if (answers.studyTimePerDay) collectedAnswers.studyTimePerDay = answers.studyTimePerDay;


    if (currentUser) {
      const userProfileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      try {
        const profileSnap = await getDoc(userProfileRef);
        const currentData = profileSnap.exists() ? profileSnap.data() as UserProfileData : {};
        
        const profileUpdate: Partial<UserProfileData> = {
          targetExams: answers.targetExam ? [answers.targetExam.toLowerCase().replace(/\s+/g, '_')] : currentData.targetExams || [],
          weakSubjects: answers.strugglingSubject && answers.strugglingSubject !== "None/Other" ? [answers.strugglingSubject] : currentData.weakSubjects || [],
          dailyStudyHours: answers.studyTimePerDay || currentData.dailyStudyHours || '',
          quickOnboardingCompleted: true,
          onboardingCompleted: currentData.onboardingCompleted || false, // Preserve full onboarding status
          email: currentUser.email || currentData.email || '',
          coins: currentData.coins || 0,
          xp: currentData.xp || 0,
          earnedBadgeIds: currentData.earnedBadgeIds || [],
          purchasedItemIds: currentData.purchasedItemIds || [],
          activeThemeId: currentData.activeThemeId === undefined ? DEFAULT_THEME_ID : currentData.activeThemeId,
          dailyChallengeStatus: currentData.dailyChallengeStatus || {},
          lastInteractionDates: currentData.lastInteractionDates || [],
        };
        if (answers.targetExam === "Other") {
            profileUpdate.otherExamName = "User Specified"; 
        }

        await setDoc(userProfileRef, profileUpdate, { merge: true });
        toast({
          title: "Profile Updated!",
          description: "Your preferences have been saved.",
        });
      } catch (error) {
        console.error("Error saving quick onboarding data for logged in user:", error);
        toast({
          title: "Error",
          description: "Could not save your preferences. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else if (anonUserId) {
        // Save to anonymousProfiles collection for guest user
        try {
            const anonProfileRef = doc(db, 'anonymousProfiles', anonUserId);
            await setDoc(anonProfileRef, collectedAnswers);
             toast({
                title: "Preferences Noted!",
                description: "We'll use this to tailor your experience. Sign up to save your progress!",
            });
        } catch (error) {
            console.error("Error saving anonymous onboarding data:", error);
            toast({
                title: "Error",
                description: "Could not note your preferences. Features might not be fully personalized.",
                variant: "destructive",
            });
            // Allow user to proceed but with a warning
        }
    }

    setIsLoading(false);
    router.push('/ai-tools'); 
  };

  const currentQuestion = questions[currentStep - 1];

  const cardVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };
  
  const [direction, setDirection] = useState(0);

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    if (newDirection > 0) handleNext();
  };

  if (authLoading && !initialCheckDone) { 
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl">
        <CardHeader className="text-center p-5 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold font-headline">
            Let's Get You Set Up!
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Just {TOTAL_QUESTIONS} quick questions.</CardDescription>
          <Progress value={(currentStep / TOTAL_QUESTIONS) * 100} className="mt-3 sm:mt-4 h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">Question {currentStep}/{TOTAL_QUESTIONS}</p>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 min-h-[280px] sm:min-h-[300px] flex flex-col justify-center overflow-hidden relative">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute w-[calc(100%-2.5rem)] sm:w-[calc(100%-3rem)]" 
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center">{currentQuestion.text}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {currentQuestion.options.map(option => (
                  <Button
                    key={option}
                    variant={answers[currentQuestion.answerKey] === option ? 'default' : 'outline'}
                    onClick={() => handleSelectAnswer(currentQuestion.answerKey, option)}
                    className="w-full text-sm sm:text-base py-2.5 h-auto justify-center transition-all duration-200 ease-in-out transform hover:scale-105"
                  >
                    {answers[currentQuestion.answerKey] === option && <CheckCircle className="mr-2 h-4 w-4" />}
                    {option}
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="p-5 sm:p-6 border-t">
          {currentStep < TOTAL_QUESTIONS ? (
            <Button
              onClick={() => paginate(1)}
              className="w-full text-base py-3"
              size="lg"
              disabled={!answers[currentQuestion.answerKey]}
            >
              Next <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full text-base py-3 bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={isLoading || !answers[currentQuestion.answerKey]}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-5 w-5" />
              )}
              {isLoading ? (currentUser ? 'Saving...' : 'Proceeding...') : 'Explore AI Tools'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
