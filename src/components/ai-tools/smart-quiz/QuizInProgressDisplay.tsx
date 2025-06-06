
'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, ChevronsRight } from 'lucide-react';
import type { GenerateQuizOutput, QuizQuestion } from '@/ai/schemas/quiz-tool-schemas';
import { cn } from '@/lib/utils';

interface UserAnswer {
  selectedOption?: number;
  skipped: boolean;
}

interface QuizInProgressDisplayProps {
  quizData: GenerateQuizOutput;
  currentQuestionIndex: number;
  userAnswers: Record<number, UserAnswer>;
  handleOptionSelect: (questionIndex: number, optionIndex: number) => void;
  handleSkipQuestion: () => void;
  handleNextQuestion: () => void;
  isLastQuestionDuringQuiz: boolean;
}

export default function QuizInProgressDisplay({
  quizData,
  currentQuestionIndex,
  userAnswers,
  handleOptionSelect,
  handleSkipQuestion,
  handleNextQuestion,
  isLastQuestionDuringQuiz,
}: QuizInProgressDisplayProps) {
  const currentQuestionData = quizData.questions[currentQuestionIndex];

  if (!currentQuestionData) return null;

  return (
    <>
      <Card className="shadow-md border-primary/40">
        <CardHeader className="p-3 sm:p-4 bg-primary/5 rounded-t-lg">
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <CardTitle className="text-md sm:text-lg font-semibold text-primary truncate" title={quizData.quizTitle}>
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
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          <Card className="shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <p className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg text-foreground">
                {currentQuestionData.questionText}
              </p>
              <RadioGroup
                value={userAnswers[currentQuestionIndex]?.selectedOption?.toString()}
                onValueChange={(value) => handleOptionSelect(currentQuestionIndex, parseInt(value))}
                className="space-y-2 sm:space-y-3"
              >
                {currentQuestionData.options.map((option, optIndex) => (
                  <div
                    key={optIndex}
                    className={cn(
                      "flex items-center space-x-2 p-2.5 sm:p-3 rounded-md border transition-all hover:bg-accent/50",
                      userAnswers[currentQuestionIndex]?.selectedOption === optIndex && "bg-primary/10 border-primary/70 ring-1 ring-primary/70"
                    )}
                  >
                    <RadioGroupItem
                      value={optIndex.toString()}
                      id={`q${currentQuestionIndex}-opt${optIndex}`}
                      className="h-4 w-4 sm:h-5 sm:w-5"
                    />
                    <Label
                      htmlFor={`q${currentQuestionIndex}-opt${optIndex}`}
                      className="font-normal text-sm sm:text-base leading-snug cursor-pointer flex-1"
                    >
                      {option}
                    </Label>
                  </div>
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
                {isLastQuestionDuringQuiz ? 'Finish & See Results' : 'Next Question'} <ChevronsRight className="ml-1.5 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
