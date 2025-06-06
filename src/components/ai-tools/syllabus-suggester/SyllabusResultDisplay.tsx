
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { BookOpen, CalendarDays, Target, Lightbulb, Sparkles } from 'lucide-react';
import type { SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';

interface SyllabusResultDisplayProps {
  generatedSyllabus: SuggestStudyTopicsOutput['generatedSyllabus'] | null;
  overallFeedback: string | null;
  formValues: { // Pass relevant form values for display
    examType: string;
    targetDate: Date;
    timeAvailablePerDay: number;
    preparationLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

export default function SyllabusResultDisplay({ generatedSyllabus, overallFeedback, formValues }: SyllabusResultDisplayProps) {
  if (!generatedSyllabus || generatedSyllabus.length === 0) {
    return (
      <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">😕 No Syllabus Generated</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <p className="text-muted-foreground text-sm sm:text-base">The AI could not generate a syllabus based on the provided inputs, or the list was empty. Please review your selections and try again. Ensure all required fields are filled correctly.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-xl sm:text-2xl font-headline">Your Personalized Study Plan for <span className="text-primary">{formValues.examType}</span> 🌟</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Target Completion: {format(formValues.targetDate, "PPP")} | {formValues.timeAvailablePerDay} hrs/day | Level: {formValues.preparationLevel}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {overallFeedback && (
            <div className="mt-1 sm:mt-2 mb-4 sm:mb-6 p-3 sm:p-4 bg-sky-50 dark:bg-sky-900/40 border border-sky-300 dark:border-sky-700 rounded-lg shadow">
                <h3 className="text-md sm:text-lg font-semibold text-sky-700 dark:text-sky-300 mb-1.5 sm:mb-2 flex items-center">
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-sky-500" /> AI Coach's Wisdom: Overall Feedback
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{overallFeedback}</p>
            </div>
        )}
        <ScrollArea className="h-[400px] md:h-[500px] pr-3 -mr-3">
            <div className="space-y-4">
                {generatedSyllabus.map((subjectSyllabus, subjectIndex) => (
                <div key={subjectIndex} className="border p-3 sm:p-4 rounded-lg bg-card/60 shadow-md">
                    <h3 className="text-lg sm:text-xl font-semibold text-primary mb-2 sm:mb-3 flex items-center">
                    <BookOpen className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" /> Subject: {subjectSyllabus.subject}
                    </h3>
                    {subjectSyllabus.summary && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/60 rounded-md border border-border">
                            <p className="text-xs sm:text-sm italic text-foreground/90"><Lightbulb className="inline-block mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400" /><strong>Quick Notes:</strong> {subjectSyllabus.summary}</p>
                        </div>
                    )}
                    <div className="space-y-3 sm:space-y-4">
                    {subjectSyllabus.schedule.map((weeklyItem, weekIndex) => (
                        <div key={`${subjectSyllabus.subject}-week-${weekIndex}`} className="pl-1 sm:pl-2">
                        <h4 className="font-medium text-sm sm:text-md text-foreground/95 flex items-center mb-1">
                            <CalendarDays className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> {weeklyItem.weekLabel}:
                        </h4>
                        {weeklyItem.topics.length > 0 ? (
                            <ul className="list-none space-y-1 sm:space-y-1.5 pl-5 sm:pl-7 mt-0.5 sm:mt-1">
                            {weeklyItem.topics.map((topic, topicIndex) => (
                                <li key={topicIndex} className="flex items-start text-xs sm:text-sm text-foreground/80">
                                    <Target className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0 mt-0.5 sm:mt-1" />
                                    <span className="break-words min-w-0">{topic}</span>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-xs sm:text-sm text-muted-foreground pl-5 sm:pl-7">No specific topics listed for this week. It might be a buffer week or revision period. 🤔</p>
                        )}
                        </div>
                    ))}
                    </div>
                </div>
                ))}
            </div>
        </ScrollArea>
        <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t">
            <p className="text-md sm:text-lg font-semibold text-accent">🚀 You've got a plan! Stick to it and conquer your exams!</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Remember, consistency is key. You can do this! 🙌</p>
        </div>
      </CardContent>
    </Card>
  );
}
