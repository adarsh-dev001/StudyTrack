
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList, FileText, Tv } from 'lucide-react';
import type { ProcessYouTubeVideoOutput } from '@/ai/flows/process-youtube-video-flow';
import type { MCQ } from '@/ai/flows/summarize-study-material'; // Re-using MCQ type
import { cn } from '@/lib/utils';

interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

interface YouTubeSummarizerResultsDisplayProps {
  analysisResult: ProcessYouTubeVideoOutput;
  mcqAnswers: Record<number, MCQWithUserAnswer>;
  handleMcqOptionChange: (questionIndex: number, optionIndex: string) => void;
  handleShowAnswer: (questionIndex: number) => Promise<void>;
}

export default function YouTubeSummarizerResultsDisplay({
  analysisResult,
  mcqAnswers,
  handleMcqOptionChange,
  handleShowAnswer
}: YouTubeSummarizerResultsDisplayProps) {

  // Basic Markdown to HTML (replace newlines, bold, italic - very simplified)
  const renderMarkdown = (markdownText: string) => {
    let html = markdownText;
    // Headers
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-md font-semibold mt-3 mb-1">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3 border-b pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 border-b pb-2">$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    // Unordered lists
    html = html.replace(/^\s*[-*+] (.*)/gm, '<li class="ml-4">$1</li>');
    html = html.replace(/^(<li.*<\/li>)+/gm, (match) => `<ul class="list-disc list-outside pl-5 my-2">${match}</ul>`);
     // Newlines
    html = html.replace(/\n/g, '<br />');
    // Remove <br /> inside <ul> that was just added
    html = html.replace(/<ul><br \/>/g, '<ul>').replace(/<\/li><br \/><li>/g, '</li><li>');


    return { __html: html };
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center text-xl sm:text-2xl font-semibold text-primary">
                <Tv className="mr-2 h-6 w-6 sm:h-7 sm:w-7" /> {analysisResult.videoTitle}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">AI-Generated Study Material from Video Transcript</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="notes" className="w-full animate-in fade-in-50 duration-500">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm h-auto">
          <TabsTrigger value="notes" className="py-1.5 sm:py-2"><FileText className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Notes</TabsTrigger>
          <TabsTrigger value="summary" className="py-1.5 sm:py-2"><ClipboardList className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-1.5 sm:py-2"><Sparkles className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-1.5 sm:py-2"><HelpCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notes">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><FileText className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Structured Notes</CardTitle>
              <CardDescription className="text-sm sm:text-base">Detailed breakdown from the video transcript.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed"
                   dangerouslySetInnerHTML={renderMarkdown(analysisResult.structuredNotes)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><ClipboardList className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Video Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Key Concepts & Terms</CardTitle>
              <CardDescription className="text-sm sm:text-base">Important takeaways from the video.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-2.5 text-base text-foreground/90 leading-relaxed">
                {analysisResult.keyConcepts.map((concept, index) => (
                  <li key={`concept-${index}`} className="flex items-start">
                      <CheckCircle className="mr-2 sm:mr-3 h-5 w-5 text-green-500 dark:text-green-400 shrink-0 mt-1" />
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
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><HelpCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Quick Quiz: Test Your Knowledge! 🧩</CardTitle>
              <CardDescription className="text-sm sm:text-base">See how well you've grasped the video content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {analysisResult.multipleChoiceQuestions.map((mcqItem, questionIndex) => {
                const mcqState = mcqAnswers[questionIndex] || { answerRevealed: false };
                const isCorrect = mcqState.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <div key={`mcq-${questionIndex}`} className="p-3 sm:p-4 border rounded-lg bg-card/30 shadow-sm">
                    <p className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg text-foreground leading-snug">Question {questionIndex + 1}: {mcqItem.question}</p>
                    <RadioGroup
                      value={mcqState.userSelectedOption?.toString()}
                      onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                      disabled={mcqState.answerRevealed}
                      className="space-y-1.5 sm:space-y-2"
                    >
                      {mcqItem.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`vid-q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "h-4 w-4 sm:h-4 sm:w-4",
                              mcqState.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-700",
                              mcqState.answerRevealed && optionIndex === mcqState.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-700"
                            )}
                          />
                          <Label 
                            htmlFor={`vid-q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "font-normal text-sm sm:text-base leading-relaxed",
                              mcqState.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "text-green-700 dark:text-green-400 font-medium",
                              mcqState.answerRevealed && optionIndex === mcqState.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "text-red-700 dark:text-red-400"
                            )}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {!mcqState.answerRevealed && (
                      <Button 
                        onClick={() => handleShowAnswer(questionIndex)} 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 sm:mt-4 text-xs sm:text-sm py-2 px-3"
                        disabled={mcqState.userSelectedOption === undefined}
                      >
                        Show Answer
                      </Button>
                    )}
                    {mcqState.answerRevealed && (
                      <div className={cn(
                          "mt-3 sm:mt-4 p-2 sm:p-3 rounded-md text-sm sm:text-base leading-relaxed",
                          isCorrect ? "bg-green-100 dark:bg-green-900/60 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200" 
                                    : "bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
                        )}
                      >
                        <div className="flex items-center font-semibold mb-1">
                          {isCorrect ? <CheckCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" /> : <XCircle className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />}
                          {isCorrect ? "Correct! 🎉" : `Incorrect. The correct answer was: ${mcqItem.options[mcqItem.correctAnswerIndex]}`}
                        </div>
                        {mcqItem.explanation && (
                          <div className="mt-1.5 sm:mt-2 flex items-start prose prose-sm dark:prose-invert max-w-none">
                             <Lightbulb className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
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
        <p className="text-md sm:text-lg font-semibold text-accent leading-relaxed">✨ Hope this helps your studies! Transform any video into learning material. Keep learning! 🚀</p>
      </div>
    </div>
  );
}

    