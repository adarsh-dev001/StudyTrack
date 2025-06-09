
'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from 'date-fns';
import { BookOpen, CalendarDays, Target as TargetIcon, Lightbulb, Sparkles, Star, ClockIcon, AlertTriangle, ThumbsUp, ThumbsDown, PlayCircle, Circle, CheckCircle, Loader2, Brain } from 'lucide-react';
import type { SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface SyllabusResultDisplayProps {
  generatedSyllabus: SuggestStudyTopicsOutput['generatedSyllabus'] | null;
  overallFeedback: string | null;
  formValues: {
    examType: string;
    targetDate: Date;
    timeAvailablePerDay: number;
    preparationLevel: 'beginner' | 'intermediate' | 'advanced';
    userName?: string;
  };
}

type TopicStatus = 'not_started' | 'in_progress' | 'completed';

interface TopicDisplayState {
  [topicKey: string]: TopicStatus;
}

const parseTopicString = (topicStr: string) => {
  let title = topicStr;
  let hours: string | null = null;
  let isHighPriority = false;

  const hoursMatch = topicStr.match(/[-*\s(](\d+(\.\d+)?h)\)?/i);
  if (hoursMatch) {
    hours = hoursMatch[1];
    title = title.replace(hoursMatch[0], '').trim();
  }

  const priorityKeywords = ['(important)', '(high weightage)', '(core)', '(high priority)'];
  priorityKeywords.forEach(keyword => {
    if (title.toLowerCase().includes(keyword)) {
      isHighPriority = true;
      title = title.replace(new RegExp(keyword.replace(/[()]/g, '\\$&'), 'gi'), '').replace(/\s\s+/g, ' ').trim();
    }
  });
  const priorityEmojis = ['🌟', '🎯', '🚀', '🔥', '💡'];
  priorityEmojis.forEach(emoji => {
    if (title.includes(emoji)) isHighPriority = true;
  });
  return { title, hours, isHighPriority };
};


export default function SyllabusResultDisplay({ generatedSyllabus, overallFeedback, formValues }: SyllabusResultDisplayProps) {
  const [topicStatuses, setTopicStatuses] = useState<TopicDisplayState>({});
  const { toast } = useToast();

  if (!generatedSyllabus || generatedSyllabus.length === 0) {
    return (
      <Card className="shadow-xl animate-in fade-in-50 duration-500 mt-6 border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader className="p-4 sm:p-6 flex flex-row items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <CardTitle className="text-lg sm:text-xl text-destructive">Syllabus Generation Failed</CardTitle>
            <CardDescription className="text-destructive/80 text-xs sm:text-sm">
              The AI could not generate a syllabus. This might be due to the selected combination of exam, subjects, or other parameters. Please try adjusting your inputs or try again later.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const handleTopicStatusChange = useCallback((subjectIndex: number, weekIndex: number, topicIndex: number) => {
    const topicKey = `s${subjectIndex}-w${weekIndex}-t${topicIndex}`;
    setTopicStatuses(prev => {
      const currentStatus = prev[topicKey] || 'not_started';
      let nextStatus: TopicStatus;
      if (currentStatus === 'not_started') nextStatus = 'in_progress';
      else if (currentStatus === 'in_progress') nextStatus = 'completed';
      else nextStatus = 'not_started';
      return { ...prev, [topicKey]: nextStatus };
    });
  }, []);

  const handleFeedback = useCallback((type: 'positive' | 'negative') => {
    toast({
      title: 'Feedback Submitted (Mock)',
      description: `Thank you for your ${type} feedback on the AI Coach's Wisdom!`,
    });
  }, [toast]);

  const handleStudyNow = useCallback((topicTitle: string) => {
    toast({
      title: `Study "${topicTitle}"`,
      description: "Integration with Pomodoro or other study tools coming soon!",
    });
  }, [toast]);

  return (
    <Card className="shadow-2xl animate-in fade-in-50 duration-500 mt-6 bg-card/80 dark:bg-slate-900/20 border-border/50">
      <CardHeader className="p-4 sm:p-6 text-center">
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline flex items-center justify-center">
           Your Personalized Study Plan
           <motion.span
             animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0]}}
             transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
             className="inline-block ml-1.5 sm:ml-2"
           >🌟</motion.span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm mt-2 space-x-2 flex flex-wrap justify-center items-center gap-1">
          <Badge variant="secondary" className="py-0.5 px-2 text-xs bg-primary/10 text-primary border-primary/30">{formValues.examType}</Badge>
          <Badge variant="secondary" className="py-0.5 px-2 text-xs">Target: {format(formValues.targetDate, "MMM d, yyyy")}</Badge>
          <Badge variant="secondary" className="py-0.5 px-2 text-xs">{formValues.timeAvailablePerDay} hrs/day</Badge>
          <Badge variant="secondary" className="py-0.5 px-2 text-xs capitalize">{formValues.preparationLevel}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {overallFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-1 sm:mt-2 mb-4 sm:mb-6 p-3 sm:p-4 bg-accent/10 dark:bg-accent/20 border border-accent/30 rounded-lg shadow-md"
            >
                <h3 className="text-md sm:text-lg font-semibold text-accent mb-1.5 sm:mb-2 flex items-center">
                    <Brain className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-accent" /> AI Coach's Wisdom:
                </h3>
                <p className="text-xs sm:text-sm text-foreground/90 dark:text-accent-foreground/80 leading-relaxed">
                    {formValues.userName && `Hello ${formValues.userName}! `}{overallFeedback}
                </p>
                <div className="mt-2 flex justify-end space-x-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-500" onClick={() => handleFeedback('positive')}><ThumbsUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => handleFeedback('negative')}><ThumbsDown className="h-4 w-4" /></Button>
                </div>
            </motion.div>
        )}
        <Accordion type="multiple" className="w-full space-y-3 sm:space-y-4">
          {generatedSyllabus.map((subjectSyllabus, subjectIndex) => (
            <AccordionItem
              value={`subject-${subjectIndex}`}
              key={`subject-${subjectIndex}`}
              className="border border-border/70 rounded-xl bg-card dark:bg-slate-900/50 shadow-lg overflow-hidden"
            >
              <AccordionTrigger className="px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:no-underline hover:bg-muted/50 dark:hover:bg-slate-800/60 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <span className="text-md sm:text-lg font-semibold text-foreground">{subjectSyllabus.subject}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-1 bg-background dark:bg-slate-900/30">
                {subjectSyllabus.summary && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="my-3 sm:my-4 p-2.5 sm:p-3 bg-muted/70 dark:bg-slate-800/40 rounded-md border border-border/50 text-xs sm:text-sm italic"
                  >
                    <Lightbulb className="inline-block mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500 dark:text-yellow-400" />
                    <strong className="text-foreground/90 dark:text-foreground/80">Quick Notes:</strong> {subjectSyllabus.summary}
                  </motion.div>
                )}
                <div className="space-y-3 sm:space-y-4">
                  {subjectSyllabus.schedule.map((weeklyItem, weekIndex) => (
                    <div key={`${subjectSyllabus.subject}-week-${weekIndex}`} className="pl-1 sm:pl-2 border-l-2 border-primary/40 dark:border-primary/60">
                      <h4 className="font-medium text-sm sm:text-md text-primary flex items-center mb-1.5 sm:mb-2 sticky top-0 bg-background/80 dark:bg-slate-900/80 backdrop-blur-sm py-1.5 z-10 rounded-r-md px-2 -ml-2 sm:-ml-3">
                        <CalendarDays className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 text-primary/80" /> {weeklyItem.weekLabel}:
                      </h4>
                      {weeklyItem.topics.length > 0 ? (
                        <ul className="space-y-2 sm:space-y-2.5 pl-1 sm:pl-2">
                          {weeklyItem.topics.map((topicStr, topicIndex) => {
                            const { title, hours, isHighPriority } = parseTopicString(topicStr);
                            const topicKey = `s${subjectIndex}-w${weekIndex}-t${topicIndex}`;
                            const currentStatus = topicStatuses[topicKey] || 'not_started';
                            let StatusIcon = Circle;
                            let statusColor = "text-muted-foreground/70";
                            if (currentStatus === 'in_progress') { StatusIcon = Loader2; statusColor = "text-blue-500 animate-spin"; }
                            else if (currentStatus === 'completed') { StatusIcon = CheckCircle; statusColor = "text-green-500"; }

                            return (
                              <motion.li
                                key={topicKey}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: topicIndex * 0.05 }}
                                className={cn(
                                  "flex items-start p-2.5 sm:p-3 rounded-lg border bg-card dark:bg-slate-800/50 shadow-md hover:shadow-lg transition-all duration-200",
                                  isHighPriority && "border-amber-500/70 dark:border-amber-600/80 ring-1 ring-amber-500/60 dark:ring-amber-600/70 bg-amber-50/50 dark:bg-amber-900/40"
                                )}>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="mr-2 sm:mr-3 mt-px h-6 w-6 sm:h-7 sm:w-7 shrink-0" onClick={() => handleTopicStatusChange(subjectIndex, weekIndex, topicIndex)}>
                                        <StatusIcon className={cn("h-4 w-4 sm:h-5 sm:w-5", statusColor)} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top"><p className="text-xs">Mark as: {
                                      currentStatus === 'not_started' ? 'In Progress' : currentStatus === 'in_progress' ? 'Completed' : 'Not Started'
                                    }</p></TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <div className="flex-grow min-w-0">
                                  <span className="text-sm sm:text-base text-foreground/95 dark:text-foreground/90 cursor-default break-words leading-tight">
                                    {title}
                                  </span>
                                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                    {hours && (
                                      <Badge variant="outline" className="px-1.5 py-px text-[10px] sm:text-xs border-primary/50 text-primary/90 bg-primary/5">
                                        <ClockIcon className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3"/> {hours}
                                      </Badge>
                                    )}
                                    {isHighPriority && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white px-1.5 py-px text-[10px] sm:text-xs">
                                              <Star className="mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" /> High Priority
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent><p className="text-xs">This topic is generally important for your exam.</p></TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="icon" className="ml-2 h-7 w-7 shrink-0 text-muted-foreground hover:text-primary" onClick={() => handleStudyNow(title)} title="Study this topic">
                                  <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                </Button>
                              </motion.li>
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
        <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t border-border/50">
            <p className="text-md sm:text-lg font-semibold text-accent dark:text-accent/90">🚀 You've got a plan! Stick to it and conquer your exams!</p>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Remember, consistency is key. You can do this! 🙌</p>
        </div>
      </CardContent>
    </Card>
  );
}

