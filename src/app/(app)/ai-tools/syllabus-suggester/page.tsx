
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Loader2, ListTree, CalendarIcon, ClockIcon } from 'lucide-react';
import { suggestStudyTopics, type SuggestStudyTopicsInput, type SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { useToast } from '@/hooks/use-toast';

const commonSubjects = [
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology (Botany & Zoology)' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'history', label: 'History' },
  { id: 'geography', label: 'Geography' },
  { id: 'polity', label: 'Polity (Civics/Political Science)' },
  { id: 'economy', label: 'Economy' },
  { id: 'general_science', label: 'General Science' },
  { id: 'english', label: 'English' },
  { id: 'current_affairs', label: 'Current Affairs' },
] as const;


const syllabusFormSchema = z.object({
  examType: z.string().min(3, { message: 'Exam type must be at least 3 characters long.' }).max(50, { message: 'Exam type cannot exceed 50 characters.' }),
  subjects: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one subject.",
  }),
  timeAvailablePerDay: z.coerce.number().min(0.5, {message: "Must study at least 0.5 hours."}).max(16, {message: "Study hours seem too high."}),
  targetDate: z.date({
    required_error: "Target date is required.",
  }).refine(date => date > new Date(), { message: "Target date must be in the future." }),
});

type SyllabusFormData = z.infer<typeof syllabusFormSchema>;

const predefinedExams = [
  { value: 'NEET', label: 'NEET (Medical Entrance)' },
  { value: 'JEE', label: 'JEE (Engineering Entrance)' },
  { value: 'UPSC', label: 'UPSC (Civil Services)' },
  { value: 'CAT', label: 'CAT (MBA Entrance)' },
  { value: 'GATE', label: 'GATE (Engineering PG)' },
];

export default function SyllabusSuggesterPage() {
  const [generatedSyllabus, setGeneratedSyllabus] = useState<SuggestStudyTopicsOutput['generatedSyllabus'] | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SyllabusFormData>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues: {
      examType: '',
      subjects: [],
      timeAvailablePerDay: 4,
      targetDate: addDays(new Date(), 90), // Default to 90 days from now
    },
  });

  const onSubmit: SubmitHandler<SyllabusFormData> = async (data) => {
    setIsLoading(true);
    setGeneratedSyllabus(null);
    setOverallFeedback(null);

    const inputForAI: SuggestStudyTopicsInput = {
      ...data,
      targetDate: format(data.targetDate, 'yyyy-MM-dd'), // Convert Date to string for AI
    };

    try {
      const result: SuggestStudyTopicsOutput = await suggestStudyTopics(inputForAI);
      setGeneratedSyllabus(result.generatedSyllabus);
      setOverallFeedback(result.overallFeedback || null);
      toast({
        title: 'Syllabus Suggested!',
        description: `Your personalized syllabus for ${data.examType} has been generated.`,
      });
    } catch (error: any) {
      console.error('Error suggesting topics:', error);
      setGeneratedSyllabus(null);
      setOverallFeedback(null);
      toast({
        title: 'Error Generating Suggestions',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <ListTree className="mr-3 h-8 w-8 text-primary" /> AI Syllabus Suggester
        </h1>
        <p className="text-lg text-muted-foreground">
          Get a personalized, topic-wise syllabus based on your exam, subjects, study time, and target date.
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Your Study Profile</CardTitle>
              <CardDescription>Provide details to generate a tailored syllabus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select the exam you're preparing for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {predefinedExams.map((exam) => (
                          <SelectItem key={exam.value} value={exam.value}>
                            {exam.label}
                          </SelectItem>
                        ))}
                         <SelectItem value="Other">Other (Specify if not listed)</SelectItem>
                      </SelectContent>
                    </Select>
                    {field.value === "Other" && (
                        <Input
                            placeholder="Specify other exam type"
                            onChange={(e) => field.onChange(e.target.value)}
                            className="mt-2"
                        />
                    )}
                    <FormDescription>
                      Choose the competitive exam you are targeting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjects"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel className="text-base">Subjects <span className="text-destructive">*</span></FormLabel>
                      <FormDescription>
                        Select all subjects you want to include in the syllabus.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                    {commonSubjects.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="subjects"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== item.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="timeAvailablePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Study Time (Hours) <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="e.g., 4.5" {...field} />
                      </FormControl>
                      <FormDescription>
                        Average hours you can dedicate to study each day.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Target Completion Date <span className="text-destructive">*</span></FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date <= new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When do you aim to complete this syllabus?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating Syllabus...
                  </>
                ) : (
                  <>
                    <ListTree className="mr-2 h-5 w-5" />
                    Generate Syllabus
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {generatedSyllabus && generatedSyllabus.length > 0 && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader>
            <CardTitle>Your Personalized Study Syllabus for {form.getValues('examType')}</CardTitle>
            <CardDescription>
              Target Completion: {format(form.getValues('targetDate'), "PPP")} ({form.getValues('timeAvailablePerDay')} hrs/day)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {overallFeedback && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300">
                    <p className="font-semibold">Overall Feedback & Advice:</p>
                    <p className="text-sm">{overallFeedback}</p>
                </div>
            )}
            {generatedSyllabus.map((subjectSyllabus, subjectIndex) => (
              <div key={subjectIndex} className="border p-4 rounded-lg bg-card/50">
                <h3 className="text-xl font-semibold text-primary mb-3">{subjectSyllabus.subject}</h3>
                {subjectSyllabus.summary && (
                    <p className="text-sm text-muted-foreground mb-3 italic">{subjectSyllabus.summary}</p>
                )}
                <div className="space-y-3">
                  {subjectSyllabus.schedule.map((weeklyItem, weekIndex) => (
                    <div key={`${subjectSyllabus.subject}-week-${weekIndex}`}>
                      <h4 className="font-medium text-md text-foreground/90">{weeklyItem.weekLabel}:</h4>
                      {weeklyItem.topics.length > 0 ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-foreground/80">
                          {weeklyItem.topics.map((topic, topicIndex) => (
                            <li key={topicIndex}>{topic}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground pl-5">No specific topics listed for this week. It might be a buffer week or revision period.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      { (generatedSyllabus === null || generatedSyllabus.length === 0) && !isLoading && form.formState.isSubmitted && (
         <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader>
            <CardTitle>No Syllabus Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI could not generate a syllabus based on the provided inputs, or the list was empty. Please review your selections and try again. Ensure all required fields are filled correctly.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

