
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod'; // Not needed here if schema is imported for type only
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Brain, HelpCircle, CheckCircle, XCircle, Lightbulb, Award, Percent } from 'lucide-react';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow'; // Main function import
import type { GenerateQuizInput, GenerateQuizOutput, QuizQuestion } from '@/ai/schemas/quiz-tool-schemas'; // Import types from the new schemas file
import { GenerateQuizInputSchema } from '@/ai/schemas/quiz-tool-schemas'; // Import schema for resolver
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { recordPlatformInteraction } from '@/lib/activity-utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Use the imported schema for form validation
const quizFormSchema = GenerateQuizInputSchema;

type QuizFormData = GenerateQuizInput; // Type is now directly from imported schema

interface QuizQuestionWithUserAnswer extends QuizQuestion {
  userSelectedOption?: number;
}

export default function SmartQuizPage() {
  const { currentUser } = useAuth();
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, number | undefined>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const { toast } = useToast();
  const quizResultsRef = useRef<HTMLDivElement>(null);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema), // Use the imported schema here
    defaultValues: {
      topic: '',
      difficulty: 'intermediate',
      examType: 'general',
      numQuestions: 5,
    },
  });

  useEffect(() => {
    if (quizData && quizResultsRef.current) {
      quizResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [quizData]);

  const onSubmit: SubmitHandler<QuizFormData> = async (data) => {
    setIsLoading(true);
    setQuizData(null);
    setUserAnswers({});
    setQuizSubmitted(false);
    setScore(0);

    try {
      const result = await generateQuiz(data);
      setQuizData(result);
      toast({
        title: '🧠 Quiz Generated!',
        description: `Your quiz on "${result.quizTitle}" is ready. Good luck!`,
      });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast({
        title: 'Error Generating Quiz 😥',
        description: error.message || 'An unexpected error occurred. Please try adjusting your inputs or try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionChange = (questionIndex: number, optionIndex: string) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: parseInt(optionIndex),
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quizData) return;
    let correctAnswers = 0;
    quizData.questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswerIndex) {
        correctAnswers++;
      }
    });
    setScore(correctAnswers);
    setQuizSubmitted(true);

    if (currentUser?.uid) {
      await recordPlatformInteraction(currentUser.uid);
    }

    toast({
      title: 'Quiz Submitted! Results Below. ✨',
      description: `You scored ${correctAnswers} out of ${quizData.questions.length}.`,
    });
     if (quizResultsRef.current) {
      quizResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const examTypeOptions = [
    { value: 'general', label: 'General Knowledge' },
    { value: 'neet', label: 'NEET (Medical)' },
    { value: 'jee', label: 'JEE (Engineering)' },
    { value: 'upsc_prelims', label: 'UPSC (Prelims)' },
    { value: 'ssc_bank', label: 'SSC / Bank Exams' },
    { value: 'cat', label: 'CAT (MBA)' },
  ];

  const difficultyOptions = [
    { value: 'basic', label: '✅ Basic (Recall)' },
    { value: 'intermediate', label: '🧠 Intermediate (Application)' },
    { value: 'advanced', label: '🔥 Advanced (Conceptual)' },
  ];


  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> SmartQuiz AI
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Generate custom quizzes on any topic, tailored to your exam and difficulty.
        </p>
      </header>

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
                      <Input placeholder="e.g., Photosynthesis, Indian National Movement, Thermodynamics" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Enter the specific topic you want the quiz on.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem className="space-y-2 sm:space-y-3">
                      <FormLabel className="text-sm sm:text-base font-semibold">Difficulty Level <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1.5 sm:space-y-2"
                        >
                          {difficultyOptions.map(opt => (
                            <FormItem key={opt.value} className="flex items-center space-x-2 sm:space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value={opt.value} id={`diff-${opt.value}`} /></FormControl>
                              <Label htmlFor={`diff-${opt.value}`} className="font-normal text-xs sm:text-sm">{opt.label}</Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="examType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base font-semibold">Target Exam Type <span className="text-destructive">*</span></FormLabel>
                       <FormDescription className="text-xs sm:text-sm pb-1">Helps AI tailor question style & tone.</FormDescription>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select exam type..." /></SelectTrigger>
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
                      <Input type="number" min="3" max="10" placeholder="e.g., 5" {...field} className="text-sm sm:text-base w-full sm:w-32" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" disabled={isLoading} size="default" className="w-full sm:w-auto text-sm sm:text-base">
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />Generating Quiz...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />Generate SmartQuiz AI</>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[200px] sm:min-h-[300px]">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-3 sm:mb-4" />
            <p className="text-md sm:text-lg font-semibold text-primary">Generating your custom quiz on "{form.getValues('topic')}"...</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">This might take a few moments. Please wait. ✨</p>
        </div>
      )}

      {quizData && !isLoading && (
        <div ref={quizResultsRef} className="space-y-4 sm:space-y-6 animate-in fade-in-50 duration-500">
          <Card className="shadow-lg border-primary/40">
            <CardHeader className="p-4 sm:p-6 bg-primary/10 rounded-t-lg">
              <CardTitle className="text-xl sm:text-2xl font-bold text-primary flex items-center">
                <Award className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> {quizData.quizTitle}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-primary/80">
                Topic: {form.getValues('topic')} | Difficulty: {form.getValues('difficulty')} | Exam: {examTypeOptions.find(e => e.value === form.getValues('examType'))?.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[calc(100vh-300px)] sm:max-h-[calc(100vh-400px)]">
                <div className="divide-y divide-border">
                {quizData.questions.map((q, qIndex) => {
                  const isCorrect = quizSubmitted && userAnswers[qIndex] === q.correctAnswerIndex;
                  const isUserSelected = userAnswers[qIndex] !== undefined;
                  const userSelectedThisOption = (optIndex: number) => quizSubmitted && userAnswers[qIndex] === optIndex;

                  return (
                    <div key={qIndex} className="p-4 sm:p-6 hover:bg-muted/30 transition-colors">
                      <p className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-foreground">
                        <span className="text-primary mr-1.5">{qIndex + 1}.</span>{q.questionText}
                      </p>
                      <RadioGroup
                        value={userAnswers[qIndex]?.toString()}
                        onValueChange={(value) => handleOptionChange(qIndex, value)}
                        disabled={quizSubmitted}
                        className="space-y-1.5 sm:space-y-2"
                      >
                        {q.options.map((option, optIndex) => (
                          <div key={optIndex} className={cn(
                            "flex items-center space-x-2 p-2 sm:p-2.5 rounded-md border transition-all",
                            quizSubmitted && optIndex === q.correctAnswerIndex && "bg-green-100 dark:bg-green-900/60 border-green-400 dark:border-green-600 ring-1 ring-green-500",
                            userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && "bg-red-100 dark:bg-red-900/60 border-red-400 dark:border-red-600 ring-1 ring-red-500",
                            !quizSubmitted && userAnswers[qIndex] === optIndex && "bg-primary/10 border-primary/50",
                            !quizSubmitted && "hover:bg-accent/50"
                          )}>
                            <RadioGroupItem
                              value={optIndex.toString()}
                              id={`q${qIndex}-opt${optIndex}`}
                              className={cn(
                                "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0",
                                quizSubmitted && optIndex === q.correctAnswerIndex && "border-green-600 text-green-700 dark:text-green-400",
                                userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && "border-red-600 text-red-700 dark:text-red-400"
                              )}
                            />
                            <Label
                              htmlFor={`q${qIndex}-opt${optIndex}`}
                              className={cn(
                                "font-normal text-xs sm:text-sm leading-snug cursor-pointer flex-1",
                                quizSubmitted && optIndex === q.correctAnswerIndex && "text-green-800 dark:text-green-300 font-medium",
                                userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && "text-red-800 dark:text-red-300"
                              )}
                            >
                              {option}
                            </Label>
                            {quizSubmitted && optIndex === q.correctAnswerIndex && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0" />}
                            {userSelectedThisOption(optIndex) && optIndex !== q.correctAnswerIndex && <XCircle className="h-4 w-4 sm:h-5 sm:h-5 text-red-600 dark:text-red-400 shrink-0" />}
                          </div>
                        ))}
                      </RadioGroup>
                      {quizSubmitted && (
                        <div className={cn(
                          "mt-3 sm:mt-4 p-2 sm:p-3 rounded-md text-xs sm:text-sm border",
                           isCorrect ? "bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
                                      : (isUserSelected ? "bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
                                                        : "bg-amber-50 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200")
                        )}>
                           <div className="flex items-center font-semibold mb-1">
                            {isCorrect ? <CheckCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> : 
                             (isUserSelected ? <XCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> : <HelpCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />)
                            }
                            {isCorrect ? "Correct! 🎉" : 
                             (isUserSelected ? "Incorrect." : "Not Answered.")
                            }
                            {!isCorrect && <span className="ml-1">Correct answer: "{q.options[q.correctAnswerIndex]}"</span>}
                          </div>
                          {q.explanation && (
                            <div className="mt-1 sm:mt-1.5 flex items-start">
                              <Lightbulb className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                              <p className="opacity-90 text-current">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 sm:p-6 border-t">
              {!quizSubmitted ? (
                <Button onClick={handleSubmitQuiz} className="w-full sm:w-auto text-sm sm:text-base" size="default" disabled={Object.keys(userAnswers).length !== quizData.questions.length}>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Submit Quiz & See Results
                </Button>
              ) : (
                <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
                  <div className="text-lg sm:text-xl font-bold text-foreground flex items-center">
                    <Percent className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary"/> Your Score: {score} / {quizData.questions.length} ({((score / quizData.questions.length) * 100).toFixed(0)}%)
                  </div>
                  <Button onClick={() => form.handleSubmit(onSubmit)()} variant="outline" className="w-full sm:w-auto text-sm sm:text-base">
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/> Generate New Quiz
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

