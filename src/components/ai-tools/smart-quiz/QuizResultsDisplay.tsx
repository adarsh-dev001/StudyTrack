
'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, CheckCircle, XCircle, Lightbulb, Sparkles, ChevronsRight, ChevronLeft, SkipForward } from 'lucide-react';
import type { GenerateQuizOutput, QuizQuestion } from '@/ai/schemas/quiz-tool-schemas';
import { cn } from '@/lib/utils';

interface UserAnswer {
  selectedOption?: number;
  skipped: boolean;
}

interface QuizResultsDisplayProps {
  quizData: GenerateQuizOutput;
  score: number;
  currentQuestionIndex: number;
  userAnswers: Record<number, UserAnswer>;
  handlePreviousQuestion: () => void;
  handleNextQuestion: () => void;
  handleRetakeQuiz: () => void;
  handleCreateNewQuiz: () => void;
}

export default function QuizResultsDisplay({
  quizData,
  score,
  currentQuestionIndex,
  userAnswers,
  handlePreviousQuestion,
  handleNextQuestion,
  handleRetakeQuiz,
  handleCreateNewQuiz,
}: QuizResultsDisplayProps) {
  const currentQuestionData = quizData.questions[currentQuestionIndex];

  if (!currentQuestionData) return null;

  return (
    <Card className="shadow-lg border-green-500/50 flex flex-col">
      <CardHeader className="p-4 sm:p-6 bg-green-500/10 rounded-t-lg text-center shrink-0">
        <Award className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-600 mb-2" />
        <CardTitle className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">🎉 Quiz Results! 🎉</CardTitle>
        <CardDescription className="text-sm sm:text-md text-green-600 dark:text-green-400 leading-relaxed">
          You scored {score} out of {quizData.questions.length} ({((score / quizData.questions.length) * 100).toFixed(0)}%)
          <br /> Reviewing Question {currentQuestionIndex + 1} / {quizData.questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="py-3 sm:py-4">
          <p className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg text-foreground leading-snug">
            <span className="text-primary mr-1.5">{currentQuestionIndex + 1}.</span>{currentQuestionData.questionText}
          </p>
          <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
            {currentQuestionData.options.map((option, optIndex) => {
              const isCorrectOption = optIndex === currentQuestionData.correctAnswerIndex;
              const isUserSelectedOption = userAnswers[currentQuestionIndex]?.selectedOption === optIndex;
              const wasSkipped = userAnswers[currentQuestionIndex]?.skipped === true;

              return (
                <div key={optIndex} className={cn(
                  "flex items-start space-x-2 p-2 sm:p-2.5 rounded-md border text-sm sm:text-base leading-relaxed",
                  isCorrectOption && "bg-green-100 dark:bg-green-900/60 border-green-400 dark:border-green-600 font-medium text-green-800 dark:text-green-300",
                  isUserSelectedOption && !isCorrectOption && !wasSkipped && "bg-red-100 dark:bg-red-900/60 border-red-400 dark:border-red-600 text-red-800 dark:text-red-300",
                  !isUserSelectedOption && !isCorrectOption && "border-muted-foreground/30"
                )}>
                  {isCorrectOption && <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />}
                  {isUserSelectedOption && !isCorrectOption && !wasSkipped && <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
                  {!isUserSelectedOption && !isCorrectOption && <div className="h-4 w-4 sm:h-5 sm:w-5 shrink-0"></div>}

                  <span className="flex-1">{option}</span>
                  {isUserSelectedOption && !wasSkipped && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 ml-auto self-center">{isCorrectOption ? "Your Answer (Correct)" : "Your Answer (Incorrect)"}</Badge>}
                  {isCorrectOption && (userAnswers[currentQuestionIndex]?.selectedOption !== optIndex || wasSkipped) && <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 ml-auto self-center">Correct Answer</Badge>}
                </div>
              );
            })}
          </div>
          {userAnswers[currentQuestionIndex]?.skipped === true && (
            <div className="mt-1 mb-2 p-2 rounded-md text-xs sm:text-sm border bg-amber-50 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300">
              <div className="flex items-center font-semibold">
                <SkipForward className="mr-1.5 h-4 w-4" /> You skipped this question.
              </div>
            </div>
          )}
          <div className={cn(
            "mt-3 p-3 sm:p-4 rounded-md border",
            "bg-muted/50 dark:bg-muted/30 border-border"
          )}>
            <div className="flex items-center font-semibold mb-1 text-base sm:text-lg">
              <Lightbulb className="mr-1.5 h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 dark:text-yellow-400 shrink-0" />
              Explanation:
            </div>
            <div className="prose prose-base dark:prose-invert max-w-none text-foreground leading-relaxed">
              <p>{currentQuestionData.explanation}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 p-4 sm:p-6 border-t shrink-0">
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handlePreviousQuestion} variant="outline" className="flex-1 sm:flex-auto text-sm sm:text-base py-2.5 px-4" disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="mr-1.5 h-4 w-4" /> Previous
          </Button>
          <Button onClick={handleNextQuestion} variant="outline" className="flex-1 sm:flex-auto text-sm sm:text-base py-2.5 px-4" disabled={currentQuestionIndex === quizData.questions.length - 1}>
            Next <ChevronsRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button onClick={handleRetakeQuiz} variant="secondary" className="flex-1 sm:flex-auto text-sm sm:text-base py-2.5 px-4">
            Retake This Quiz
          </Button>
          <Button onClick={handleCreateNewQuiz} className="flex-1 sm:flex-auto text-sm sm:text-base py-2.5 px-4">
            <Sparkles className="mr-2 h-4 w-4" /> Create New Quiz
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
