
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList } from 'lucide-react';
import type { SummarizeStudyMaterialOutput, MCQ } from '@/ai/flows/summarize-study-material';
import { cn } from '@/lib/utils';

interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

interface SummarizerResultsDisplayProps {
  analysisResult: SummarizeStudyMaterialOutput;
  mcqAnswers: Record<number, MCQWithUserAnswer>;
  topic: string;
  handleMcqOptionChange: (questionIndex: number, optionIndex: string) => void;
  handleShowAnswer: (questionIndex: number) => Promise<void>; // Make it async
}

export default function SummarizerResultsDisplay({
  analysisResult,
  mcqAnswers,
  topic,
  handleMcqOptionChange,
  handleShowAnswer
}: SummarizerResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="summary" className="w-full animate-in fade-in-50 duration-500">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 text-xs sm:text-sm h-auto sm:h-10">
          <TabsTrigger value="summary" className="py-1.5 sm:py-2"><ClipboardList className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-1.5 sm:py-2"><Sparkles className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-1.5 sm:py-2"><HelpCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-md sm:text-lg"><ClipboardList className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" /> 📌 Summary of Your Material</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Topic: {topic}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose prose-xs sm:prose-sm max-w-none dark:prose-invert text-foreground leading-relaxed">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-md sm:text-lg"><Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" /> 🧠 Core Concepts Unpacked</CardTitle>
              <CardDescription className="text-xs sm:text-sm">The main ideas from your material.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-2 text-sm sm:text-base text-foreground/90">
                {analysisResult.keyConcepts.map((concept, index) => (
                  <li key={`concept-${index}`} className="flex items-start">
                      <CheckCircle className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                      <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-md sm:text-lg"><HelpCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Quick Quiz: Test Your Knowledge! 🧩</CardTitle>
              <CardDescription className="text-xs sm:text-sm">See how well you've grasped the concepts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {Object.entries(mcqAnswers).map(([qIndexStr, mcqItem]) => {
                const questionIndex = parseInt(qIndexStr);
                const isCorrect = mcqItem.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <div key={`mcq-${questionIndex}`} className="p-3 sm:p-4 border rounded-lg bg-card/30 shadow-sm">
                    <p className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base text-foreground">Question {questionIndex + 1}: {mcqItem.question}</p>
                    <RadioGroup
                      value={mcqItem.userSelectedOption?.toString()}
                      onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                      disabled={mcqItem.answerRevealed}
                      className="space-y-1.5 sm:space-y-2"
                    >
                      {mcqItem.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "h-3.5 w-3.5 sm:h-4 sm:w-4",
                              mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-700",
                              mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-700"
                            )}
                          />
                          <Label 
                            htmlFor={`q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "font-normal text-xs sm:text-sm",
                              mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "text-green-700 dark:text-green-400 font-medium",
                              mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "text-red-700 dark:text-red-400"
                            )}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {!mcqItem.answerRevealed && (
                      <Button 
                        onClick={() => handleShowAnswer(questionIndex)} 
                        variant="outline" 
                        size="xs" 
                        className="mt-3 sm:mt-4 text-xs"
                        disabled={mcqItem.userSelectedOption === undefined}
                      >
                        Show Answer
                      </Button>
                    )}
                    {mcqItem.answerRevealed && (
                      <div className={cn(
                          "mt-3 sm:mt-4 p-2 sm:p-3 rounded-md text-xs sm:text-sm",
                          isCorrect ? "bg-green-100 dark:bg-green-900/60 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200" 
                                    : "bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
                        )}
                      >
                        <div className="flex items-center font-semibold mb-1">
                          {isCorrect ? <CheckCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" /> : <XCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />}
                          {isCorrect ? "Correct! 🎉" : `Incorrect. The correct answer was: ${mcqItem.options[mcqItem.correctAnswerIndex]}`}
                        </div>
                        {mcqItem.explanation && (
                          <div className="mt-1.5 sm:mt-2 flex items-start">
                             <Lightbulb className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                             <p className="opacity-90">{mcqItem.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="mt-6 sm:mt-8 text-center p-3 sm:p-4 border-t bg-card rounded-b-lg">
        <p className="text-sm sm:text-md font-semibold text-accent">✨ Understanding is power! Use these insights to supercharge your learning. You're doing great! 💪</p>
      </div>
    </div>
  );
}
