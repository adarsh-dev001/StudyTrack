
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useForm, type SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { Loader2, ListTree, CalendarIcon, Sparkles, BookOpen, CalendarDays, Target, Lightbulb, Brain, Users, FileText, Goal, Edit } from 'lucide-react';
import { suggestStudyTopics, type SuggestStudyTopicsInput, type SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import { TARGET_EXAMS as PREDEFINED_EXAMS_CONST, PREPARATION_LEVELS, DAILY_STUDY_HOURS_OPTIONS, LANGUAGE_MEDIUMS, STUDY_MODES, EXAM_SUBJECT_MAP } from '@/lib/constants';
import { motion } from 'framer-motion';


// Lazy load result display
const SyllabusResultDisplay = React.lazy(() => import('@/components/ai-tools/syllabus-suggester/SyllabusResultDisplay'));
const SyllabusResultDisplayFallback = React.lazy(() => import('@/components/ai-tools/syllabus-suggester/SyllabusResultDisplayFallback'));


const syllabusFormSchema = z.object({
  examType: z.string().min(1, { message: 'Exam type is required.' }).max(50, { message: 'Exam type cannot exceed 50 characters.' }),
  subjects: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one subject.",
  }),
  timeAvailablePerDay: z.coerce.number().min(0.5, {message: "Must study at least 0.5 hours."}).max(16, {message: "Study hours seem too high."}),
  targetDate: z.date({
    required_error: "Target date is required.",
  }).refine(date => date > new Date(), { message: "Target date must be in the future." }),
  preparationLevel: z.enum(['beginner', 'intermediate', 'advanced'], { required_error: "Preparation level is required."}),
  studyMode: z.string().optional(),
  weakTopics: z.array(z.string()).optional().transform(val => val ? val.map(s => s.trim()).filter(s => s.length > 0) : []),
  preferredLanguage: z.string().optional(),
  goals: z.string().max(300, {message: "Goals should be concise (max 300 chars)."}).optional(),
});

type SyllabusFormData = z.infer<typeof syllabusFormSchema>;

export default function SyllabusSuggesterPage() {
  const { currentUser } = useAuth();
  const [generatedSyllabus, setGeneratedSyllabus] = useState<SuggestStudyTopicsOutput['generatedSyllabus'] | null>(null);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const syllabusResultRef = useRef<HTMLDivElement>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isInputFormCollapsed, setIsInputFormCollapsed] = useState(false);

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

  const watchedExamType = useWatch({ control: form.control, name: 'examType' });

  const availableSubjectsForForm = React.useMemo(() => {
    if (!watchedExamType) return EXAM_SUBJECT_MAP['other'] || [];
    return EXAM_SUBJECT_MAP[watchedExamType.toLowerCase()] || EXAM_SUBJECT_MAP['other'] || [];
  }, [watchedExamType]);

  useEffect(() => {
    const currentSelectedSubjects = form.getValues('subjects') || [];
    const newRelevantSelectedSubjects = currentSelectedSubjects.filter(subjectId =>
      availableSubjectsForForm.some(availSub => availSub.id === subjectId)
    );

    if (newRelevantSelectedSubjects.length !== currentSelectedSubjects.length || (availableSubjectsForForm.length > 0 && newRelevantSelectedSubjects.length === 0 && currentSelectedSubjects.length > 0)) {
      form.setValue('subjects', newRelevantSelectedSubjects, { shouldValidate: true, shouldDirty: true });
    } else if (availableSubjectsForForm.length > 0 && currentSelectedSubjects.length === 0) {
        form.setValue('subjects', [], { shouldValidate: true, shouldDirty: true });
    } else if (availableSubjectsForForm.length === 0) {
        form.setValue('subjects', [], { shouldValidate: true, shouldDirty: true });
    }
  }, [availableSubjectsForForm, form]);


  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
        setIsLoadingProfile(true);
        const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
        unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
            if (profileSnap.exists()) {
                const data = profileSnap.data() as UserProfileData;
                setUserProfile(data);
                  if (!form.formState.isDirty) {
                     const dailyHoursMatch = DAILY_STUDY_HOURS_OPTIONS.find(opt => data.dailyStudyHours?.includes(opt.value.split('-')[0]));
                     const prepLevelMatch = PREPARATION_LEVELS.find(pl => data.subjectDetails?.[0]?.preparationLevel === pl.value || data.preparationLevel === pl.value);

                     const initialExamType = data.targetExams && data.targetExams.length > 0
                                    ? (data.targetExams[0] === 'other' && data.otherExamName ? data.otherExamName : data.targetExams[0])
                                    : '';

                     const subjectsForInitialExam = initialExamType ? (EXAM_SUBJECT_MAP[initialExamType.toLowerCase()] || EXAM_SUBJECT_MAP['other']) : [];
                     const initialSubjects = data.subjectDetails?.map(sd => sd.subjectId).filter(id => subjectsForInitialExam.some(sfe => sfe.id === id)) || [];


                     form.reset({
                        examType: initialExamType,
                        subjects: initialSubjects,
                        timeAvailablePerDay: dailyHoursMatch ? parseFloat(dailyHoursMatch.value.split('-')[0]) : 4,
                        targetDate: data.examAttemptYear ? new Date(parseInt(data.examAttemptYear), 5, 1) : addDays(new Date(), 90),
                        preparationLevel: (prepLevelMatch?.value || 'intermediate') as 'beginner' | 'intermediate' | 'advanced',
                        studyMode: data.studyMode || 'self_study',
                        weakTopics: data.weakSubjects || [],
                        preferredLanguage: data.languageMedium || 'english',
                        goals: '',
                    });
                  }
            } else {
              setUserProfile(null);
            }
            setIsLoadingProfile(false);
        }, (err) => {
            console.error("Error fetching profile:", err);
            toast({ title: "Error", description: "Could not load your profile.", variant: "destructive" });
            setIsLoadingProfile(false);
        });
    } else {
        setIsLoadingProfile(false);
    }
     return () => {
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [currentUser?.uid, form, toast]);


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
      userName: userProfile?.fullName || currentUser?.displayName || undefined,
      targetDate: format(data.targetDate, 'yyyy-MM-dd'),
    };

    try {
      const result: SuggestStudyTopicsOutput = await suggestStudyTopics(inputForAI);
      setGeneratedSyllabus(result.generatedSyllabus);
      setOverallFeedback(result.overallFeedback || null);
      setIsInputFormCollapsed(true);
      toast({
        title: 'Syllabus Suggested! 🚀',
        description: `Your personalized syllabus for ${data.examType} has been generated.`,
      });
    } catch (error: any) {
      console.error('Error suggesting topics:', error);
      setGeneratedSyllabus(null);
      setOverallFeedback(null);
      setIsInputFormCollapsed(false);
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

  const predefinedExams = PREDEFINED_EXAMS_CONST.map(exam => ({
    value: exam.value,
    label: exam.label
  }));

  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem', transition: { duration: 0.4, ease: "easeInOut" } },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem', transition: { duration: 0.4, ease: "easeInOut" } }
  };


  return (
    <div className="w-full space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <ListTree className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Syllabus Suggester
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Get a personalized, topic-wise syllabus based on your exam, subjects, study time, and target date.
        </p>
      </div>

      {isInputFormCollapsed && (
        <motion.div
          className="flex justify-center pt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            onClick={() => {
              setIsInputFormCollapsed(false);
              setGeneratedSyllabus(null);
              setOverallFeedback(null);
            }}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base py-2.5 px-5 shadow-md hover:bg-accent/50"
          >
            <Edit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Create New Syllabus or Modify
          </Button>
        </motion.div>
      )}

      <motion.div
        animate={isInputFormCollapsed ? "collapsed" : "expanded"}
        variants={inputFormVariants}
        style={{ overflow: 'hidden', transformOrigin: 'top' }}
        className={isInputFormCollapsed ? "mt-0" : ""}
      >
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
                      <Select
                          onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue('subjects', [], { shouldValidate: true });
                          }}
                          value={field.value || ''}
                      >
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
                      {watchedExamType === 'other' && (
                          <Input
                              placeholder="Specify other exam type"
                              onChange={(e) => field.onChange(e.target.value)}
                              className="mt-2 text-sm sm:text-base"
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
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-1 sm:mb-2">
                        <FormLabel className="text-sm sm:text-base font-semibold">Subjects <span className="text-destructive">*</span></FormLabel>
                        <FormDescription className="text-xs sm:text-sm">
                          Select subjects relevant to your chosen exam.
                        </FormDescription>
                      </div>
                      {availableSubjectsForForm.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-2.5 pt-1 sm:pt-2">
                          {availableSubjectsForForm.map((item) => (
                          <FormItem
                              key={item.id}
                              className="flex flex-row items-center space-x-2 space-y-0"
                          >
                              <FormControl>
                              <Checkbox
                                  id={`subject-checkbox-${item.id}`}
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                  const currentSelection = field.value || [];
                                  return checked
                                      ? field.onChange([...currentSelection, item.id])
                                      : field.onChange(currentSelection.filter(value => value !== item.id));
                                  }}
                              />
                              </FormControl>
                              <Label htmlFor={`subject-checkbox-${item.id}`} className="font-normal text-xs sm:text-sm cursor-pointer">
                                  {item.name}
                              </Label>
                          </FormItem>
                          ))}
                          </div>
                      ) : (
                          <p className="text-xs text-muted-foreground pt-1">Select an exam type to see relevant subjects, or subjects for "Other" will be shown.</p>
                      )}
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
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="e.g., 4.5"
                            {...field}
                            value={isNaN(field.value as number) ? '' : field.value}
                            className="text-sm sm:text-base"
                          />
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
                            {(PREPARATION_LEVELS || []).map(level => (
                              <SelectItem key={level.value} value={level.value} className="text-sm sm:text-base">{level.label}</SelectItem>
                            ))}
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
                            {(STUDY_MODES || []).map(m => <SelectItem key={m.value} value={m.value} className="text-sm sm:text-base">{m.label}</SelectItem>)}
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
                          onChange={(e) => field.onChange(e.target.value.split(',').map(s=>s.trim()).filter(s=>s))}
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
                          {(LANGUAGE_MEDIUMS || []).map(lang => (
                            <SelectItem key={lang.value} value={lang.value} className="text-sm sm:text-base">{lang.label}</SelectItem>
                          ))}
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
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">What are your broader objectives for this preparation period?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </CardContent>
              <CardFooter className="p-4 sm:p-6">
                <Button type="submit" disabled={isLoading || !watchedExamType} size="default" className="w-full sm:w-auto text-sm sm:text-base">
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
      </motion.div>

      <div ref={syllabusResultRef}>
        {(isLoading && form.formState.isSubmitted) && (
           <Suspense fallback={null}>
            <SyllabusResultDisplayFallback />
          </Suspense>
        )}
        {generatedSyllabus && generatedSyllabus.length > 0 && !isLoading && (
          <Suspense fallback={<SyllabusResultDisplayFallback />}>
            <SyllabusResultDisplay
              generatedSyllabus={generatedSyllabus}
              overallFeedback={overallFeedback}
              formValues={{
                examType: form.getValues('examType'),
                targetDate: form.getValues('targetDate'),
                timeAvailablePerDay: form.getValues('timeAvailablePerDay'),
                preparationLevel: form.getValues('preparationLevel')
              }}
            />
          </Suspense>
        )}
         {generatedSyllabus === null && !isLoading && form.formState.isSubmitted && (
          <Suspense fallback={null}>
            <SyllabusResultDisplay generatedSyllabus={null} overallFeedback={null} formValues={form.getValues()} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
