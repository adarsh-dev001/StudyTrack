
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { BookOpen, CalendarDays, Target, Lightbulb, Sparkles, Star, ClockIcon, AlertTriangle } from 'lucide-react';
import type { SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { cn } from '@/lib/utils';

interface SyllabusResultDisplayProps {
  generatedSyllabus: SuggestStudyTopicsOutput['generatedSyllabus'] | null;
  overallFeedback: string | null;
  formValues: {
    examType: string;
    targetDate: Date;
    timeAvailablePerDay: number;
    preparationLevel: 'beginner' | 'intermediate' | 'advanced';
  };
}

// Helper to parse topic string for details
const parseTopicString = (topicStr: string) => {
  let title = topicStr;
  let hours: string | null = null;
  let priorityMarkers: string[] = [];
  let isHighPriority = false;

  // Regex to find hours like (Xh) or *Xh* or - Xh
  const hoursMatch = topicStr.match(/[-*\s(](\d+(\.\d+)?h)\)?/i);
  if (hoursMatch) {
    hours = hoursMatch[1];
    title = title.replace(hoursMatch[0], '').trim();
  }

  // Keywords for priority (case-insensitive)
  const priorityKeywords = ['(important)', '(high weightage)', '(core)', '(high priority)'];
  priorityKeywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword)) {
      isHighPriority = true;
      // Remove keyword for cleaner title display, handle multiple spaces
      title = title.replace(new RegExp(keyword.replace(/[()]/g, '\\$&'), 'gi'), '').replace(/\s\s+/g, ' ').trim();
      priorityMarkers.push(keyword.replace(/[()]/g, '').trim());
    }
  });

  // Emojis for priority
  const priorityEmojis = ['🌟', '🎯', '🚀', '🔥', '💡'];
  priorityEmojis.forEach(emoji => {
    if (title.includes(emoji)) {
      isHighPriority = true;
      // Emojis are usually kept in the title for visual appeal
      // priorityMarkers.push(emoji); // Optionally add emoji to markers if needed elsewhere
    }
  });
  
  // Handle bold/italic from AI markdown-like syntax if present
  // For now, assume the AI might pass **text** or *text*.
  // The actual rendering of markdown within the title would require a markdown parser.
  // Here, we are just extracting metadata.

  return { title, hours, isHighPriority, priorityMarkers };
};


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
        <Accordion type="multiple" className="w-full space-y-3">
          {generatedSyllabus.map((subjectSyllabus, subjectIndex) => (
            <AccordionItem value={`subject-${subjectIndex}`} key={`subject-${subjectIndex}`} className="border rounded-lg bg-card/60 shadow-md overflow-hidden">
              <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 text-left hover:no-underline">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="text-md sm:text-lg font-semibold text-foreground">{subjectSyllabus.subject}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1">
                {subjectSyllabus.summary && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-muted/60 rounded-md border border-border text-xs sm:text-sm italic text-foreground/90">
                    <Lightbulb className="inline-block mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400" />
                    <strong>Quick Notes:</strong> {subjectSyllabus.summary}
                  </div>
                )}
                <div className="space-y-3 sm:space-y-4">
                  {subjectSyllabus.schedule.map((weeklyItem, weekIndex) => (
                    <div key={`${subjectSyllabus.subject}-week-${weekIndex}`} className="pl-1 sm:pl-2 border-l-2 border-primary/30">
                      <h4 className="font-medium text-sm sm:text-md text-foreground/95 flex items-center mb-1.5 sm:mb-2 sticky top-0 bg-card/80 backdrop-blur-sm py-1 z-10">
                        <CalendarDays className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> {weeklyItem.weekLabel}:
                      </h4>
                      {weeklyItem.topics.length > 0 ? (
                        <ul className="space-y-2 sm:space-y-2.5 pl-1 sm:pl-2">
                          {weeklyItem.topics.map((topicStr, topicIndex) => {
                            const { title, hours, isHighPriority } = parseTopicString(topicStr);
                            return (
                              <li key={topicIndex} 
                                  className={cn(
                                    "flex items-start p-2 sm:p-2.5 rounded-md border bg-background shadow-sm hover:shadow-md transition-shadow",
                                    isHighPriority && "border-amber-500/70 ring-1 ring-amber-500/50 bg-amber-50 dark:bg-amber-900/30"
                                  )}>
                                <Checkbox id={`topic-${subjectIndex}-${weekIndex}-${topicIndex}`} className="mr-2 sm:mr-3 mt-1 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                <div className="flex-grow min-w-0">
                                  <label htmlFor={`topic-${subjectIndex}-${weekIndex}-${topicIndex}`} className="text-xs sm:text-sm text-foreground/90 cursor-pointer break-words">
                                    {title}
                                  </label>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    {hours && (
                                      <Badge variant="outline" className="px-1.5 py-0.5 text-[10px] sm:text-xs border-primary/50 text-primary/90">
                                        <ClockIcon className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3"/> {hours}
                                      </Badge>
                                    )}
                                    {isHighPriority && (
                                      <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600 px-1.5 py-0.5 text-[10px] sm:text-xs">
                                        <Star className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> High Priority
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground pl-1 sm:pl-2">No specific topics listed for this week. It might be a buffer week or revision period. 🤔</p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t">
            <p className="text-md sm:text-lg font-semibold text-accent">🚀 You've got a plan! Stick to it and conquer your exams!</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Remember, consistency is key. You can do this! 🙌</p>
        </div>
      </CardContent>
    </Card>
  );
}
