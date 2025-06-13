
'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Brain, HelpCircle, Award, Wand2, Edit } from 'lucide-react';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import type { GenerateQuizInput, GenerateQuizOutput } from '@/ai/schemas/quiz-tool-schemas';
import { GenerateQuizInputSchema } from '@/ai/schemas/quiz-tool-schemas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { recordPlatformInteraction } from '@/lib/activity-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Removed as per previous refactor
// import OnboardingForm from '@/components/onboarding/onboarding-form'; // Removed as per previous refactor
import { Skeleton } from '@/components/ui/skeleton';
import OnboardingGate from '@/components/onboarding/OnboardingRequiredGate'; // Corrected import path

const QuizInProgressDisplay = React.lazy(() => import('@/components/ai-tools/smart-quiz/QuizInProgressDisplay'));
const QuizResultsDisplay = React.lazy(() => import('@/components/ai-tools/smart-quiz/QuizResultsDisplay'));
const QuizInProgressDisplayFallback = React.lazy(() => import('@/components/ai-tools/smart-quiz/QuizInProgressDisplayFallback'));
const QuizResultsDisplayFallback = React.lazy(() => import('@/components/ai-tools/smart-quiz/QuizResultsDisplayFallback'));


const quizFormSchema = GenerateQuizInputSchema;
type QuizFormData = GenerateQuizInput;

interface UserAnswer {
  selectedOption?: number;
  skipped: boolean;
}

type QuizState = 'idle' | 'generating' | 'inProgress' | 'submitted';

const examTypeOptions = [
  { value: 'general', label: 'General Knowledge' },
  { value: 'neet', label: 'NEET (Medical)' },
  { value: 'jee', label: 'JEE (Engineering)' },
  { value: 'upsc_prelims', label: 'UPSC (Prelims)' },
  { value: 'ssc_bank', label: 'SSC / Bank Exams' },
  { value: 'cat', label: 'CAT (MBA)' },
];

const difficultyLevels = [
  { value: 'basic', label: 'Basic', icon: '✅' },
  { value: 'intermediate', label: 'Intermediate', icon: '🧠' },
  { value: 'advanced', label: 'Advanced', icon: '🔥' },
];

// Removed OnboardingFormFallback as OnboardingForm is no longer used here

export default function SmartQuizPage() {
  const { currentUser } = useAuth();
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('idle');

  const { toast } = useToast();
  const quizAreaRef = useRef<HTMLDivElement>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  // const [showOnboardingModal, setShowOnboardingModal] = useState(false); // Removed

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      topic: '',
      difficulty: 'intermediate',
      examType: 'general',
      numQuestions: 5,
    },
  });

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserProfile(data);
          if (data.targetExams && data.targetExams.length > 0) {
            const primaryExam = data.targetExams[0] === 'other' && data.otherExamName ? data.otherExamName.toLowerCase() : data.targetExams[0];
            const matchingExamOption = examTypeOptions.find(opt => primaryExam?.includes(opt.value) || opt.value.includes(primaryExam || ''));
            if (matchingExamOption) {
              form.setValue('examType', matchingExamOption.value as QuizFormData['examType']);
            }
          }
          // Removed logic for setShowOnboardingModal
        } else {
          setUserProfile(null);
          // Removed logic for setShowOnboardingModal
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
  }, [currentUser?.uid, form, toast]);

  // Removed handleOnboardingSuccess

  useEffect(() => {
    if ((quizState === 'inProgress' || quizState === 'submitted') && quizAreaRef.current) {
      quizAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [quizState, currentQuestionIndex]);

  const onSubmit: SubmitHandler<QuizFormData> = async (data) => {
    setQuizState('generating');
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);

    try {
      const result = await generateQuiz(data);
      setQuizData(result);
      const initialAnswers: Record<number, UserAnswer> = {};
      result.questions.forEach((_, index) => {
        initialAnswers[index] = { selectedOption: undefined, skipped: false };
      });
      setUserAnswers(initialAnswers);
      setQuizState('inProgress');
      toast({
        title: '🧠 Quiz Generated!',
        description: `Your quiz on "${result.quizTitle}" is ready. Good luck!`,
      });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      setQuizState('idle');
      toast({
        title: 'Error Generating Quiz 😥',
        description: error.message || 'An unexpected error occurred. Please try adjusting your inputs or try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: { ...prev[questionIndex], selectedOption: optionIndex, skipped: false },
    }));
  };

  const handleSubmitQuiz = useCallback(async () => {
    if (!quizData) return;
    let correctAnswers = 0;
    quizData.questions.forEach((q, index) => {
      if (userAnswers[index]?.selectedOption === q.correctAnswerIndex && !userAnswers[index]?.skipped) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setQuizState('submitted');
    setCurrentQuestionIndex(0); // Reset to first question for review

    if (currentUser?.uid) {
      await recordPlatformInteraction(currentUser.uid);
    }

    toast({
      title: '🎉 Quiz Results! 🎉',
      description: `You scored ${correctAnswers} out of ${quizData.questions.length}. Review your answers below.`,
    });
  }, [quizData, userAnswers, currentUser, toast]);

  const handleNextQuestion = useCallback(() => {
    if (!quizData) return;

    if (quizState === 'inProgress') {
      const currentAnswer = userAnswers[currentQuestionIndex];
      if (currentAnswer?.selectedOption === undefined && !currentAnswer?.skipped) {
          toast({
              title: "Selection Required",
              description: "Please select an answer or skip the question.",
              variant: "default"
          });
          return;
      }
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        handleSubmitQuiz();
      }
    } else if (quizState === 'submitted') {
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  }, [quizData, quizState, userAnswers, currentQuestionIndex, handleSubmitQuiz, toast]);


  const handleSkipQuestion = useCallback(() => {
    if (!quizData || quizState !== 'inProgress') return;
    setUserAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: { selectedOption: undefined, skipped: true },
    }));
    if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    } else {
        handleSubmitQuiz();
    }
  }, [quizData, quizState, currentQuestionIndex, handleSubmitQuiz]);


  const handlePreviousQuestion = useCallback(() => {
    if (quizState === 'submitted' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [quizState, currentQuestionIndex]);

  const handleRetakeQuiz = useCallback(() => {
    if (!quizData) return;
    const initialAnswers: Record<number, UserAnswer> = {};
    quizData.questions.forEach((_, index) => {
        initialAnswers[index] = { selectedOption: undefined, skipped: false };
    });
    setUserAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('inProgress');
  }, [quizData]);

  const handleCreateNewQuiz = useCallback(() => {
    form.reset();
    form.setValue('examType', userProfile?.targetExams?.[0] || 'general'); // Pre-fill from profile if available
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('idle');
  }, [form, userProfile]);

  const isLastQuestionDuringQuiz = quizData && quizState === 'inProgress' ? currentQuestionIndex === quizData.questions.length - 1 : false;

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Your Profile...</p>
      </div>
    );
  }

  // Onboarding Gate Logic
  if (!userProfile?.hasCompletedOnboarding) {
    return <OnboardingGate featureName="Smart Quiz" hasPaid={true} />; // Assuming SmartQuiz is a paid feature or general access after onboarding
  }


  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem' },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem' }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> Generate Quizzes Instantly with AI
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Enter a topic, choose your difficulty, and get started.
        </p>
      </header>

      <motion.div
        animate={quizState === 'idle' ? "expanded" : "collapsed"}
        variants={inputFormVariants}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ overflow: 'hidden', transformOrigin: 'top' }}
        className={quizState !== 'idle' ? "mt-0" : ""}
      >
        {quizState === 'idle' && (
          <Card className="shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Configure Your Quiz ⚙️</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Tell the AI what kind of quiz you need.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Quiz Topic <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Photosynthesis, Indian National Movement, Thermodynamics" {...field} className="text-sm sm:text-base h-11 sm:h-12" />
                        </FormControl>
                        <FormDescription className="text-xs sm:text-sm">
                          Enter the specific topic you want the quiz on.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Difficulty Level <span className="text-destructive">*</span></FormLabel>
                      <FormField
                          control={form.control}
                          name="difficulty"
                          render={({ field }) => (
                              <ToggleGroup
                                  type="single"
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  className="grid grid-cols-3 gap-1 sm:gap-2 mt-2"
                                  aria-label="Difficulty level"
                              >
                                  {difficultyLevels.map(level => (
                                  <ToggleGroupItem
                                      key={level.value}
                                      value={level.value}
                                      aria-label={level.label}
                                      className="h-10 sm:h-11 text-xs sm:text-sm px-2"
                                  >
                                      <span className="mr-1 sm:mr-1.5">{level.icon}</span>{level.label}
                                  </ToggleGroupItem>
                                  ))}
                              </ToggleGroup>
                          )}
                      />
                      <FormMessage className="mt-1" />
                    </FormItem>
                    <FormField
                      control={form.control}
                      name="examType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm sm:text-base font-semibold">Target Exam Type <span className="text-destructive">*</span></FormLabel>
                          <FormDescription className="text-xs sm:text-sm pb-1">Helps AI tailor question style & tone.</FormDescription>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-sm sm:text-base h-10 sm:h-11"><SelectValue placeholder="Select exam type..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {examTypeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-sm sm:text-base">{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="numQuestions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Number of Questions (3-10) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input type="number" min="3" max="10" placeholder="e.g., 5" {...field} value={isNaN(field.value as number) ? '' : field.value} className="text-sm sm:text-base w-full sm:w-32 h-10 sm:h-11" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="p-4 sm:p-6">
                  <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                      size="lg"
                      className="w-full sm:w-auto text-base py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate SmartQuiz
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}
      </motion.div>


      {(quizState === 'generating') && (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[200px] sm:min-h-[300px]">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
            <p className="text-md sm:text-lg font-semibold text-primary">Generating your custom quiz on "{form.getValues('topic')}"...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This might take a few moments. Please wait. ✨</p>
        </div>
      )}

      {quizData && (quizState === 'inProgress' || quizState === 'submitted') && (
        <div ref={quizAreaRef} className="space-y-4 sm:space-y-6">
            {quizState === 'inProgress' && currentQuestionIndex < quizData.questions.length && (
              <Suspense fallback={<QuizInProgressDisplayFallback />}>
                <QuizInProgressDisplay
                  quizData={quizData}
                  currentQuestionIndex={currentQuestionIndex}
                  userAnswers={userAnswers}
                  handleOptionSelect={handleOptionSelect}
                  handleSkipQuestion={handleSkipQuestion}
                  handleNextQuestion={handleNextQuestion}
                  isLastQuestionDuringQuiz={isLastQuestionDuringQuiz}
                />
              </Suspense>
            )}

           {quizState === 'submitted' && currentQuestionIndex < quizData.questions.length && (
            <Suspense fallback={<QuizResultsDisplayFallback />}>
              <QuizResultsDisplay
                quizData={quizData}
                score={score}
                currentQuestionIndex={currentQuestionIndex}
                userAnswers={userAnswers}
                handlePreviousQuestion={handlePreviousQuestion}
                handleNextQuestion={handleNextQuestion}
                handleRetakeQuiz={handleRetakeQuiz}
                handleCreateNewQuiz={handleCreateNewQuiz}
              />
            </Suspense>
            )}
        </div>
      )}
    </div>
  );
}

    
