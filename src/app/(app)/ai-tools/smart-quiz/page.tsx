
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Brain, HelpCircle, CheckCircle, XCircle, Lightbulb, Award, Percent, SkipForward, ChevronsRight, Wand2 } from 'lucide-react';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import type { GenerateQuizInput, GenerateQuizOutput, QuizQuestion } from '@/ai/schemas/quiz-tool-schemas';
import { GenerateQuizInputSchema } from '@/ai/schemas/quiz-tool-schemas';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { recordPlatformInteraction } from '@/lib/activity-utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function SmartQuizPage() {
  const { currentUser } = useAuth();
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, UserAnswer>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('idle');

  const { toast } = useToast();
  const quizAreaRef = useRef<HTMLDivElement>(null);
  const questionCardRef = useRef<HTMLDivElement>(null);

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
      // Initialize userAnswers structure
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
  
  const handleSkipQuestion = () => {
    if (!quizData) return;
    setUserAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: { selectedOption: undefined, skipped: true },
    }));
    if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
    } else {
        handleSubmitQuiz();
    }
  };

  const handleNextQuestion = () => {
    if (!quizData) return;
     // User must have selected an option or explicitly skipped to proceed
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
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    let correctAnswers = 0;
    quizData.questions.forEach((q, index) => {
      if (userAnswers[index]?.selectedOption === q.correctAnswerIndex && !userAnswers[index]?.skipped) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setQuizState('submitted');

    if (currentUser?.uid) {
      await recordPlatformInteraction(currentUser.uid);
    }

    toast({
      title: '🎉 Quiz Results! 🎉',
      description: `You scored ${correctAnswers} out of ${quizData.questions.length}. Review your answers below.`,
    });
  };

  const handleRetakeQuiz = () => {
    if (!quizData) return;
    const initialAnswers: Record<number, UserAnswer> = {};
    quizData.questions.forEach((_, index) => {
        initialAnswers[index] = { selectedOption: undefined, skipped: false };
    });
    setUserAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('inProgress');
  };
  
  const handleCreateNewQuiz = () => {
    form.reset();
    setQuizData(null);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizState('idle');
  };

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const isLastQuestion = quizData ? currentQuestionIndex === quizData.questions.length - 1 : false;
  const canProceed = userAnswers[currentQuestionIndex]?.selectedOption !== undefined || userAnswers[currentQuestionIndex]?.skipped === true;


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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input type="number" min="3" max="10" placeholder="e.g., 5" {...field} className="text-sm sm:text-base w-full sm:w-32 h-10 sm:h-11" />
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
                    className="w-full sm:w-auto text-base py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
                >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate SmartQuiz
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      )}

      {(quizState === 'generating') && (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[200px] sm:min-h-[300px]">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
            <p className="text-md sm:text-lg font-semibold text-primary">Generating your custom quiz on "{form.getValues('topic')}"...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This might take a few moments. Please wait. ✨</p>
        </div>
      )}

      {quizData && (quizState === 'inProgress' || quizState === 'submitted') && (
        <div ref={quizAreaRef} className="space-y-4 sm:space-y-6">
            
            {quizState === 'inProgress' && currentQuestion && (
            <>
                <Card className="shadow-md border-primary/40">
                    <CardHeader className="p-3 sm:p-4 bg-primary/5 rounded-t-lg">
                        <div className="flex justify-between items-center mb-1 sm:mb-2">
                            <CardTitle className="text-md sm:text-lg font-semibold text-primary">
                                {quizData.quizTitle}
                            </CardTitle>
                            <Badge variant="outline" className="text-xs sm:text-sm">Question {currentQuestionIndex + 1} of {quizData.questions.length}</Badge>
                        </div>
                        <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="h-2 sm:h-2.5" />
                    </CardHeader>
                </Card>
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestionIndex}
                        ref={questionCardRef}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full"
                    >
                        <Card className="shadow-lg">
                            <CardContent className="p-4 sm:p-6">
                                <p className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-foreground">
                                    {currentQuestion.questionText}
                                </p>
                                <RadioGroup
                                    value={userAnswers[currentQuestionIndex]?.selectedOption?.toString()}
                                    onValueChange={(value) => handleOptionSelect(currentQuestionIndex, parseInt(value))}
                                    className="space-y-2 sm:space-y-3"
                                >
                                    {currentQuestion.options.map((option, optIndex) => (
                                    <FormItem 
                                        key={optIndex} 
                                        className={cn(
                                            "flex items-center space-x-2 p-2.5 sm:p-3 rounded-md border transition-all hover:bg-accent/50",
                                            userAnswers[currentQuestionIndex]?.selectedOption === optIndex && "bg-primary/10 border-primary/70 ring-1 ring-primary/70"
                                        )}
                                    >
                                        <FormControl>
                                        <RadioGroupItem
                                            value={optIndex.toString()}
                                            id={`q${currentQuestionIndex}-opt${optIndex}`}
                                            className="h-4 w-4 sm:h-5 sm:w-5"
                                        />
                                        </FormControl>
                                        <Label
                                        htmlFor={`q${currentQuestionIndex}-opt${optIndex}`}
                                        className="font-normal text-sm sm:text-base leading-snug cursor-pointer flex-1"
                                        >
                                        {option}
                                        </Label>
                                    </FormItem>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                            <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-3 p-4 sm:p-6 border-t">
                                <Button 
                                    onClick={handleSkipQuestion} 
                                    variant="outline"
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                    size="sm"
                                >
                                    <SkipForward className="mr-1.5 h-4 w-4" /> Skip Question
                                </Button>
                                <Button 
                                    onClick={handleNextQuestion} 
                                    className="w-full sm:w-auto text-xs sm:text-sm"
                                    size="sm"
                                    disabled={userAnswers[currentQuestionIndex]?.selectedOption === undefined && userAnswers[currentQuestionIndex]?.skipped !== true}
                                >
                                    {isLastQuestion ? 'Finish & See Results' : 'Next Question'} <ChevronsRight className="ml-1.5 h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </>
            )}

            {quizState === 'submitted' && (
            <Card className="shadow-lg border-green-500/50">
                <CardHeader className="p-4 sm:p-6 bg-green-500/10 rounded-t-lg text-center">
                    <Award className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-600 mb-2" />
                    <CardTitle className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">🎉 Quiz Results! 🎉</CardTitle>
                    <CardDescription className="text-sm sm:text-md text-green-600 dark:text-green-400">
                        You scored {score} out of {quizData.questions.length} ({((score / quizData.questions.length) * 100).toFixed(0)}%)
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                 <ScrollArea className="max-h-[calc(100vh-350px)] sm:max-h-[calc(100vh-450px)]">
                    <div className="divide-y divide-border">
                    {quizData.questions.map((q, qIndex) => {
                        const userAnswer = userAnswers[qIndex];
                        const isCorrect = !userAnswer?.skipped && userAnswer?.selectedOption === q.correctAnswerIndex;
                        const wasSkipped = userAnswer?.skipped === true;
                        const userSelectedThisOption = (optIndex: number) => userAnswer?.selectedOption === optIndex;

                        return (
                        <div key={qIndex} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors">
                            <p className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-foreground">
                            <span className="text-primary mr-1.5">{qIndex + 1}.</span>{q.questionText}
                            </p>
                            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                            {q.options.map((option, optIndex) => (
                                <div key={optIndex} className={cn(
                                "flex items-center space-x-2 p-2 sm:p-2.5 rounded-md border text-xs sm:text-sm",
                                optIndex === q.correctAnswerIndex && "bg-green-100 dark:bg-green-900/60 border-green-400 dark:border-green-600 font-medium text-green-800 dark:text-green-300",
                                userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && !wasSkipped && "bg-red-100 dark:bg-red-900/60 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
                                !userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && "border-muted-foreground/30"
                                )}>
                                {optIndex === q.correctAnswerIndex && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />}
                                {userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && !wasSkipped && <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />}
                                {!userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && <div className="h-4 w-4 shrink-0"></div>}
                                
                                <span className="flex-1">{option}</span>
                                {userSelectedThisOption(optIndex) && !wasSkipped && <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{optIndex === q.correctAnswerIndex ? "Your Answer (Correct)" : "Your Answer (Incorrect)"}</Badge>}
                                </div>
                            ))}
                            </div>
                             {wasSkipped && (
                                <div className="mt-1 mb-2 p-2 rounded-md text-xs sm:text-sm border bg-amber-50 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300">
                                    <div className="flex items-center font-semibold">
                                        <SkipForward className="mr-1.5 h-4 w-4" /> You skipped this question.
                                    </div>
                                    <p className="mt-0.5">The correct answer was: "{q.options[q.correctAnswerIndex]}"</p>
                                </div>
                            )}
                            <div className={cn(
                                "p-2 sm:p-3 rounded-md text-xs sm:text-sm border",
                                isCorrect ? "bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
                                        : (userAnswer?.selectedOption !== undefined && !wasSkipped ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
                                                                    : "bg-muted/50 dark:bg-muted/30 border-border") // Neutral for skipped or non-error if not selected
                            )}>
                                <div className="flex items-center font-semibold mb-1">
                                    <Lightbulb className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 dark:text-yellow-400 shrink-0" />
                                    Explanation:
                                </div>
                                <p className="opacity-90 text-current">{q.explanation}</p>
                            </div>
                        </div>
                        );
                    })}
                    </div>
                 </ScrollArea>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 p-4 sm:p-6 border-t">
                    <Button onClick={handleRetakeQuiz} variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                        Retake This Quiz
                    </Button>
                    <Button onClick={handleCreateNewQuiz} className="w-full sm:w-auto text-sm sm:text-base">
                        <Sparkles className="mr-2 h-4 w-4"/> Create New Quiz
                    </Button>
                </CardFooter>
            </Card>
            )}
        </div>
      )}
    </div>
  );
}

