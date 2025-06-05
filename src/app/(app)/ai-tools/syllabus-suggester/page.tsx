
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Loader2, ListTree, CalendarIcon, Sparkles, BookOpen, CalendarDays, Target, Lightbulb, Brain, Users, FileText, Goal } from 'lucide-react';
import { suggestStudyTopics, type SuggestStudyTopicsInput, type SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import OnboardingRequiredGate from '@/components/onboarding/OnboardingRequiredGate'; // Import the gate

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
  { id: 'quantitative_aptitude', label: 'Quantitative Aptitude' },
  { id: 'reasoning_ability', label: 'Reasoning Ability' },
  { id: 'optional_subject_1', label: 'Optional Subject 1 (e.g., for UPSC)' },
  { id: 'optional_subject_2', label: 'Optional Subject 2 (e.g., for UPSC)' },
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
  preparationLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: "Preparation level is required."}),
  studyMode: z.string().optional(),
  weakTopics: z.string().optional().transform(val => val ? val.split(',').map(s => s.trim()).filter(s => s.length > 0) : []),
  preferredLanguage: z.string().optional(),
  goals: z.string().max(300, {message: "Goals should be concise (max 300 chars)."}).optional(),
});

type SyllabusFormData = z.infer<typeof syllabusFormSchema>;

const predefinedExams = [
  { value: 'NEET', label: 'NEET (Medical Entrance)' },
  { value: 'JEE', label: 'JEE (Engineering Entrance)' },
  { value: 'UPSC', label: 'UPSC (Civil Services)' },
  { value: 'CAT', label: 'CAT (MBA Entrance)' },
  { value: 'GATE', label: 'GATE (Engineering PG)' },
  { value: 'SSC', label: 'SSC (CGL, CHSL, etc.)' },
  { value: 'Banking', label: 'Banking (PO, Clerk, RBI)' },
  { value: 'Other', label: 'Other (Specify)' },
];

export default function SyllabusSuggesterPage() {
  const { currentUser } = useAuth();
  const [generatedSyllabus, setGeneratedSyllabus] = useState<SuggestStudyTopicsOutput['generatedSyllabus'] | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const syllabusResultRef = useRef<HTMLDivElement>(null); 
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const form = useForm<SyllabusFormData>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues: {
      examType: '',
      subjects: [],
      timeAvailablePerDay: 4,
      targetDate: addDays(new Date(), 90), 
      preparationLevel: 'intermediate',
      studyMode: 'self_study',
      weakTopics: [],
      preferredLanguage: 'english',
      goals: '',
    },
  });
  
  useEffect(() => {
    async function fetchAndSetProfileData() {
        if (currentUser?.uid) {
            setIsLoadingProfile(true);
            const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
            const profileSnap = await getDoc(profileDocRef);
            if (profileSnap.exists()) {
                const data = profileSnap.data() as UserProfileData;
                setOnboardingCompleted(data.onboardingCompleted || false);
                if (data.onboardingCompleted) {
                    form.reset({
                        examType: data.targetExams && data.targetExams.length > 0 
                                    ? (data.targetExams[0] === 'other' && data.otherExamName ? data.otherExamName : data.targetExams[0]) 
                                    : '',
                        subjects: data.subjectDetails?.map(sd => sd.subjectId) || [], 
                        timeAvailablePerDay: data.dailyStudyHours ? parseFloat(data.dailyStudyHours.split('-')[0]) : 4,
                        targetDate: data.examAttemptYear ? new Date(parseInt(data.examAttemptYear), 5, 1) : addDays(new Date(), 90),
                        preparationLevel: (data.subjectDetails && data.subjectDetails.length > 0 ? data.subjectDetails[0].preparationLevel : 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
                        studyMode: data.studyMode || 'self_study',
                        weakTopics: data.weakSubjects || [],
                        preferredLanguage: data.languageMedium || 'english',
                        goals: '', // Goals are usually specific to a plan
                    });
                }
            } else {
              setOnboardingCompleted(false);
            }
            setIsLoadingProfile(false);
        } else {
            setIsLoadingProfile(false);
            setOnboardingCompleted(false);
        }
    }
    fetchAndSetProfileData();
  }, [currentUser, form.reset, form]); // Added form to dependencies


  useEffect(() => {
    if (generatedSyllabus && generatedSyllabus.length > 0 && syllabusResultRef.current) {
      syllabusResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedSyllabus]);

  const onSubmit: SubmitHandler<SyllabusFormData> = async (data) => {
    setIsLoading(true);
    setGeneratedSyllabus(null);
    setOverallFeedback(null);

    const inputForAI: SuggestStudyTopicsInput = {
      ...data,
      userName: currentUser?.displayName || undefined,
      targetDate: format(data.targetDate, 'yyyy-MM-dd'),
    };

    try {
      const result: SuggestStudyTopicsOutput = await suggestStudyTopics(inputForAI);
      setGeneratedSyllabus(result.generatedSyllabus);
      setOverallFeedback(result.overallFeedback || null);
      toast({
        title: 'Syllabus Suggested! 🚀',
        description: `Your personalized syllabus for ${data.examType} has been generated.`,
      });
    } catch (error: any) {
      console.error('Error suggesting topics:', error);
      setGeneratedSyllabus(null);
      setOverallFeedback(null);
      toast({
        title: 'Error Generating Suggestions 😥',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Syllabus Suggester...</p>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <OnboardingRequiredGate featureName="AI Syllabus Suggester" />;
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <ListTree className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Syllabus Suggester
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Get a personalized, topic-wise syllabus based on your exam, subjects, study time, and target date.
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Your Study Profile 🧑‍🎓</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Provide details to generate a tailored syllabus. Required fields are marked with <span className="text-destructive">*</span>.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Exam Type <span className="text-destructive">*</span></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Select the exam you're preparing for" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {predefinedExams.map((exam) => (
                          <SelectItem key={exam.value} value={exam.value} className="text-sm sm:text-base">
                            {exam.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.watch('examType') === "Other" && (
                        <Input
                            placeholder="Specify other exam type"
                            onChange={(e) => field.onChange(e.target.value)}
                            className="mt-2 text-sm sm:text-base"
                            value={form.watch('examType') === 'Other' ? field.value : ''} // Only show/bind if 'Other' is selected
                        />
                    )}
                    <FormDescription className="text-xs sm:text-sm">
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
                    <div className="mb-1 sm:mb-2">
                      <FormLabel className="text-sm sm:text-base font-semibold">Subjects <span className="text-destructive">*</span></FormLabel>
                      <FormDescription className="text-xs sm:text-sm">
                        Select all subjects you want to include in the syllabus.
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-2.5 pt-1 sm:pt-2">
                    {commonSubjects.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="subjects"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-center space-x-2 space-y-0"
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
                              <FormLabel className="text-xs sm:text-sm font-normal">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="timeAvailablePerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Daily Study Time (Hours) <span className="text-destructive">*</span> ⏳</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.5" placeholder="e.g., 4.5" {...field} className="text-sm sm:text-base"/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm sm:text-base">Target Completion Date <span className="text-destructive">*</span> 🎯</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal text-sm sm:text-base",
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="preparationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Current Preparation Level <span className="text-destructive">*</span> <Brain className="inline h-4 w-4 text-muted-foreground" /></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select your level" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="beginner" className="text-sm sm:text-base">Beginner (Just Started)</SelectItem>
                          <SelectItem value="intermediate" className="text-sm sm:text-base">Intermediate (Covered Basics)</SelectItem>
                          <SelectItem value="advanced" className="text-sm sm:text-base">Advanced (Syllabus Done, Revising)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studyMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Preferred Study Mode <Users className="inline h-4 w-4 text-muted-foreground" /></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl><SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="e.g., Self-study" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="self_study" className="text-sm sm:text-base">Self-study</SelectItem>
                          <SelectItem value="coaching" className="text-sm sm:text-base">Coaching</SelectItem>
                          <SelectItem value="hybrid" className="text-sm sm:text-base">Hybrid (Self + Coaching)</SelectItem>
                          <SelectItem value="online" className="text-sm sm:text-base">Online Courses</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="weakTopics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Weak Topics/Areas (Optional) <Lightbulb className="inline h-4 w-4 text-muted-foreground" /></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List topics you find challenging, separated by commas (e.g., Organic Chemistry, Modern Physics)"
                        className="min-h-[70px] resize-y text-sm sm:text-base"
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">Helps AI tailor the plan to your needs.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Preferred Language (Optional) <FileText className="inline h-4 w-4 text-muted-foreground" /></FormLabel>
                     <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl><SelectTrigger className="text-sm sm:text-base"><SelectValue placeholder="Select language" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="english" className="text-sm sm:text-base">English</SelectItem>
                        <SelectItem value="hindi" className="text-sm sm:text-base">Hindi</SelectItem>
                        <SelectItem value="other_regional" className="text-sm sm:text-base">Other Regional Language</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs sm:text-sm">If relevant for study material suggestions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Overall Study Goals (Optional) <Goal className="inline h-4 w-4 text-muted-foreground" /></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Cover 70% syllabus in 3 months, Achieve 95th percentile in mocks..."
                        className="min-h-[70px] resize-y text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">What are your broader objectives for this preparation period?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" disabled={isLoading} size="default" className="w-full sm:w-auto text-sm sm:text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Generating Syllabus...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Generate Personalized Syllabus
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {generatedSyllabus && generatedSyllabus.length > 0 && (
        <Card ref={syllabusResultRef} className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl font-headline">Your Personalized Study Plan for <span className="text-primary">{form.getValues('examType')}</span> 🌟</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Target Completion: {format(form.getValues('targetDate'), "PPP")} | {form.getValues('timeAvailablePerDay')} hrs/day | Level: {form.getValues('preparationLevel')}
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
            <div className="mt-6 sm:mt-8 text-center pt-4 sm:pt-6 border-t">
                <p className="text-md sm:text-lg font-semibold text-accent">🚀 You've got a plan! Stick to it and conquer your exams!</p>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Remember, consistency is key. You can do this! 🙌</p>
            </div>
          </CardContent>
        </Card>
      )}

      { (generatedSyllabus === null || generatedSyllabus.length === 0) && !isLoading && form.formState.isSubmitted && (
         <Card ref={syllabusResultRef} className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">😕 No Syllabus Generated</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <p className="text-muted-foreground text-sm sm:text-base">The AI could not generate a syllabus based on the provided inputs, or the list was empty. Please review your selections and try again. Ensure all required fields are filled correctly.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
