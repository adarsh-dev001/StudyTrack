
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import type { UserProfileData, QuickOnboardingDataToStore } from '@/lib/profile-types';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogPortal, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TARGET_EXAMS as PREDEFINED_EXAMS_CONST, EXAM_SUBJECT_MAP } from '@/lib/constants';

interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  answerKey: keyof OnboardingAnswers;
  isMultiSelect?: boolean;
}

interface OnboardingAnswers {
  targetExam: string[];
  strugglingSubject: string;
  studyTimePerDay: string;
  otherExamName?: string;
}

const questions: QuizQuestion[] = [
  { id: 1, text: "What are you preparing for?", options: PREDEFINED_EXAMS_CONST.map(e => e.label), answerKey: 'targetExam', isMultiSelect: false },
  { id: 2, text: "Which subject do you find most challenging?", options: ["Physics", "Chemistry", "Biology", "Math", "History", "General Aptitude", "None/Other"], answerKey: 'strugglingSubject' },
  { id: 3, text: "How much time can you dedicate to study per day?", options: ["<1 hr", "1-2 hrs", "2-4 hrs", ">4 hrs"], answerKey: 'studyTimePerDay' },
];

const TOTAL_QUESTIONS = questions.length;
const ANON_USER_ID_KEY = 'anonUserId_studytrack_v2';

interface QuickOnboardingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export default function QuickOnboardingModal({ isOpen, onOpenChange, onComplete }: QuickOnboardingModalProps) {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({ targetExam: [] });
  const [otherExamNameInput, setOtherExamNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectAnswer = useCallback((questionAnswerKey: keyof OnboardingAnswers, answer: string) => {
    if (questionAnswerKey === 'targetExam') {
      setAnswers(prev => ({ ...prev, targetExam: [answer] }));
      if (answer.toLowerCase() !== 'other') {
        setOtherExamNameInput('');
      }
    } else {
      setAnswers(prev => ({ ...prev, [questionAnswerKey]: answer }));
    }
  }, []);

  const handleNext = useCallback(() => {
    const currentQuestionDef = questions[currentStep - 1];
    const currentAnswer = answers[currentQuestionDef.answerKey];
    
    let isValid = false;
    if (currentQuestionDef.answerKey === 'targetExam') {
        isValid = answers.targetExam !== undefined && answers.targetExam.length > 0 && 
                  (answers.targetExam[0].toLowerCase() !== 'other' || (answers.targetExam[0].toLowerCase() === 'other' && otherExamNameInput.trim() !== ''));
    } else {
        isValid = currentAnswer !== undefined && currentAnswer !== '';
    }

    if (isValid) {
      if (currentStep < TOTAL_QUESTIONS) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    } else {
      toast({
        title: "Selection Required",
        description: `Please select an answer${currentQuestionDef.answerKey === 'targetExam' && answers.targetExam?.[0]?.toLowerCase() === 'other' ? ' and specify the exam name' : ''} to proceed.`,
        variant: "destructive",
        duration: 2500,
      });
    }
  }, [currentStep, answers, otherExamNameInput, toast]);


  const handleSubmit = useCallback(async () => {
    const finalQuestionDef = questions[TOTAL_QUESTIONS - 1];
    if (!answers[finalQuestionDef.answerKey]) {
         toast({
            title: "Final Answer Needed",
            description: "Please select an answer for the last question.",
            variant: "destructive",
            duration: 2000,
        });
        return;
    }
    if (answers.targetExam?.[0]?.toLowerCase() === 'other' && !otherExamNameInput.trim()) {
        toast({
            title: "Exam Name Required",
            description: "Please specify the exam name for 'Other'.",
            variant: "destructive",
            duration: 2000,
        });
        return;
    }

    setIsLoading(true);

    const targetExamLabel = answers.targetExam?.[0] || '';
    const targetExamConstEntry = PREDEFINED_EXAMS_CONST.find(e => e.label === targetExamLabel);
    const actualTargetExamValue = targetExamConstEntry ? targetExamConstEntry.value : targetExamLabel;


    if (currentUser) {
      const userProfileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      try {
        const profileSnap = await getDoc(userProfileRef);
        const currentData = profileSnap.exists() ? profileSnap.data() as UserProfileData : {};
        
        const profileUpdate: Partial<UserProfileData> = {
          email: currentUser.email || currentData.email || '',
          coins: currentData.coins || 0,
          xp: currentData.xp || 0,
          earnedBadgeIds: currentData.earnedBadgeIds || [],
          purchasedItemIds: currentData.purchasedItemIds || [],
          activeThemeId: currentData.activeThemeId === undefined ? DEFAULT_THEME_ID : currentData.activeThemeId,
          dailyChallengeStatus: currentData.dailyChallengeStatus || {},
          lastInteractionDates: currentData.lastInteractionDates || [],
          quickOnboardingCompleted: true,
          onboardingCompleted: currentData.onboardingCompleted || false,
        };

        if (actualTargetExamValue) {
            profileUpdate.targetExams = [actualTargetExamValue];
            if (actualTargetExamValue.toLowerCase() === 'other' && otherExamNameInput.trim()) {
                profileUpdate.otherExamName = otherExamNameInput.trim();
            } else if (actualTargetExamValue.toLowerCase() !== 'other') {
                profileUpdate.otherExamName = ''; // Clear if not 'Other'
            } else {
                // If 'Other' but no name, keep existing or set to empty
                profileUpdate.otherExamName = currentData.otherExamName || '';
            }
        } else {
            profileUpdate.targetExams = currentData.targetExams || [];
            profileUpdate.otherExamName = currentData.otherExamName || '';
        }

        if (answers.strugglingSubject) {
            if (answers.strugglingSubject !== "None/Other") {
                profileUpdate.weakSubjects = [answers.strugglingSubject];
            } else {
                profileUpdate.weakSubjects = [];
            }
        } else {
             profileUpdate.weakSubjects = currentData.weakSubjects || [];
        }

        if (answers.studyTimePerDay) {
            profileUpdate.dailyStudyHours = answers.studyTimePerDay;
        } else {
            profileUpdate.dailyStudyHours = currentData.dailyStudyHours || '';
        }
        
        await setDoc(userProfileRef, profileUpdate, { merge: true });
        toast({ title: "Preferences Saved!", description: "Your AI experience will now be more personalized." });
        onComplete();
      } catch (error) {
        console.error("Error saving quick onboarding for logged in user:", error);
        toast({ title: "Save Error", description: "Could not save preferences.", variant: "destructive" });
      }
    } else { // Anonymous user
      let anonId = localStorage.getItem(ANON_USER_ID_KEY);
      if (!anonId) {
        anonId = uuidv4();
        localStorage.setItem(ANON_USER_ID_KEY, anonId);
      }
      try {
        const anonProfileData: QuickOnboardingDataToStore = {
            quickOnboardingCompleted: true,
            createdAt: Timestamp.now(),
        };
        if (actualTargetExamValue) {
            anonProfileData.targetExam = actualTargetExamValue;
            if (actualTargetExamValue.toLowerCase() === 'other' && otherExamNameInput.trim()) {
                anonProfileData.otherExamName = otherExamNameInput.trim();
            }
            // If targetExam is not 'other', or 'other' without name, otherExamName is omitted.
        }
        if (answers.strugglingSubject) anonProfileData.strugglingSubject = answers.strugglingSubject;
        if (answers.studyTimePerDay) anonProfileData.studyTimePerDay = answers.studyTimePerDay;
        
        const anonProfileRef = doc(db, 'anonymousProfiles', anonId);
        await setDoc(anonProfileRef, anonProfileData);
        localStorage.setItem('quickOnboardingDone_anon_v2', 'true');
        toast({ title: "Preferences Noted!", description: "Sign up to save your progress and get the full experience!" });
        onComplete();
      } catch (error) {
        console.error("Error saving anonymous quick onboarding:", error);
        toast({ title: "Save Error", description: "Could not note preferences.", variant: "destructive" });
      }
    }
    setIsLoading(false);
  }, [answers, currentUser, onComplete, toast, otherExamNameInput]);

  const currentQuestion = questions[currentStep - 1];
  const cardVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction: number) => ({ zIndex: 0, x: direction < 0 ? 300 : -300, opacity: 0 }),
  };
  const [direction, setDirection] = useState(0);
  const paginate = (newDirection: number) => { setDirection(newDirection); handleNext(); };

  if (authLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg p-6">
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-5 sm:p-6 border-b text-center">
          <DialogTitle className="text-xl sm:text-2xl md:text-2xl font-bold font-headline">Personalize Your AI Experience</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Answer {TOTAL_QUESTIONS} quick questions to tailor AI suggestions.</DialogDescription>
          <Progress value={(currentStep / TOTAL_QUESTIONS) * 100} className="mt-3 sm:mt-4 h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">Question {currentStep}/{TOTAL_QUESTIONS}</p>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(100vh-200px)] sm:max-h-[60vh]">
          <div className="p-5 sm:p-6 min-h-[260px] sm:min-h-[280px] flex flex-col justify-center overflow-hidden relative">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="w-full"
              >
                <h3 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4 text-center">{currentQuestion.text}</h3>
                <div className="grid grid-cols-1 gap-2 sm:gap-2.5 max-w-sm mx-auto">
                  {currentQuestion.options.map(option => (
                    <Button
                      key={option}
                      variant={(answers[currentQuestion.answerKey] === option && currentQuestion.answerKey !== 'targetExam') || (currentQuestion.answerKey === 'targetExam' && answers.targetExam?.includes(option)) ? 'default' : 'outline'}
                      onClick={() => handleSelectAnswer(currentQuestion.answerKey, option)}
                      className="w-full text-xs sm:text-sm py-2.5 h-auto justify-center transition-all duration-200 ease-in-out transform hover:scale-103"
                    >
                      {(answers[currentQuestion.answerKey] === option && currentQuestion.answerKey !== 'targetExam') || (currentQuestion.answerKey === 'targetExam' && answers.targetExam?.includes(option)) ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                      {option}
                    </Button>
                  ))}
                </div>
                {currentQuestion.answerKey === 'targetExam' && answers.targetExam?.[0]?.toLowerCase() === 'other' && (
                  <div className="mt-3 sm:mt-4 max-w-sm mx-auto">
                    <input
                      type="text"
                      value={otherExamNameInput}
                      onChange={(e) => setOtherExamNameInput(e.target.value)}
                      placeholder="Please specify your exam name"
                      className="w-full p-2 border rounded-md text-xs sm:text-sm h-10 bg-background"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
        
        <div className="p-5 sm:p-6 border-t">
          {currentStep < TOTAL_QUESTIONS ? (
            <Button onClick={() => paginate(1)} className="w-full text-sm sm:text-base py-2.5" size="lg" >
              Next <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="w-full text-sm sm:text-base py-2.5 bg-green-600 hover:bg-green-700" size="lg" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 sm:h-5 w-4 sm:w-5 animate-spin" /> : <CheckCircle className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />}
              {isLoading ? (currentUser ? 'Saving...' : 'Proceeding...') : 'Unlock AI Tools'}
            </Button>
          )}
           {currentStep > 1 && (
            <Button variant="ghost" onClick={() => setCurrentStep(s => s - 1)} className="w-full mt-2 text-xs sm:text-sm text-muted-foreground">
              Previous
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
