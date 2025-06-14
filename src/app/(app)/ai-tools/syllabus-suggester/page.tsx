'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useForm, type SubmitHandler, useWatch, FormProvider } from 'react-hook-form'; // Added FormProvider
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// OnboardingForm is not used on this page directly anymore, gate handles it.
// import OnboardingForm from '@/components/onboarding/onboarding-form'; 
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { TARGET_EXAMS as PREDEFINED_EXAMS_CONST, PREPARATION_LEVELS, DAILY_STUDY_HOURS_OPTIONS, LANGUAGE_MEDIUMS, STUDY_MODES, EXAM_SUBJECT_MAP } from '@/lib/constants';
import { motion } from 'framer-motion';
import OnboardingGate from '@/components/onboarding/OnboardingRequiredGate';


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
  }).refine(date => date > new Date(new Date().setDate(new Date().getDate() - 1)), { message: "Target date must be today or in the future." }), // Allow today
  preparationLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert'], { required_error: "Preparation level is required."}), // Added 'expert'
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

  const methods = useForm<SyllabusFormData>({ // Use methods from useForm
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
  
  const { control, setValue, getValues, formState, trigger, reset } = methods; // Destructure from methods
  const watchedExamType = useWatch({ control, name: 'examType' });

  const availableSubjectsForForm = React.useMemo(() => {
    if (!watchedExamType) return EXAM_SUBJECT_MAP['other'] || [];
    return EXAM_SUBJECT_MAP[watchedExamType.toLowerCase()] || EXAM_SUBJECT_MAP['other'] || [];
  }, [watchedExamType]);

  useEffect(() => {
    if (formState.dirtyFields.examType) { 
        setValue('subjects', [], { shouldValidate: true, shouldDirty: true });
    }
  }, [watchedExamType, setValue, formState.dirtyFields.examType]);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserProfile(data);
          if (!formState.isDirty) { // Only pre-fill if form hasn't been touched by user
            
            const initialExamType = data.targetExams && data.targetExams.length > 0 
              ? (data.targetExams[0].toLowerCase() === 'other' && data.otherExamName ? data.otherExamName : data.targetExams[0]) 
              : '';
            setValue('examType', initialExamType, { shouldDirty: false });

            const subjectsForInitialExam = initialExamType ? (EXAM_SUBJECT_MAP[initialExamType.toLowerCase()] || EXAM_SUBJECT_MAP['other']) : [];
            const initialSubjects = data.subjectDetails
                ?.map(sd => sd.subjectId)
                .filter(id => subjectsForInitialExam.some(sfe => sfe.id === id)) 
                || data.weakSubjects?.filter(id => subjectsForInitialExam.some(sfe => sfe.id === id)) // Fallback to weakSubjects if no subjectDetails
                || [];
            setValue('subjects', initialSubjects, { shouldDirty: false });
            
            let timeToSet = 4; // Default
            if (data.dailyStudyHours) {
                const hoursMatch = data.dailyStudyHours.match(/(\d+(\.\d+)?)/); // Extracts first number
                if (hoursMatch && hoursMatch[1]) {
                    const parsedHours = parseFloat(hoursMatch[1]);
                    if (!isNaN(parsedHours)) {
                       timeToSet = parsedHours;
                    }
                } else { // Try matching against options if direct parsing fails
                    const dailyHoursOption = DAILY_STUDY_HOURS_OPTIONS.find(opt => data.dailyStudyHours === opt.label || data.dailyStudyHours === opt.value);
                    if (dailyHoursOption) {
                        const optionHoursMatch = dailyHoursOption.value.match(/(\d+(\.\d+)?)/);
                        if (optionHoursMatch && optionHoursMatch[1]) {
                             const parsedOptionHours = parseFloat(optionHoursMatch[1]);
                             if (!isNaN(parsedOptionHours)) timeToSet = parsedOptionHours;
                        }
                    }
                }
            }
            setValue('timeAvailablePerDay', timeToSet, { shouldDirty: false });
            
            let prepLevelToSet: SyllabusFormData['preparationLevel'] = 'intermediate'; // Default
            const profilePrepLevel = data.preparationLevel || data.subjectDetails?.[0]?.preparationLevel;
            if (profilePrepLevel) {
                const foundLevel = PREPARATION_LEVELS.find(pl => pl.value === profilePrepLevel);
                if (foundLevel) {
                    if (foundLevel.value === 'expert') {
                        prepLevelToSet = 'advanced'; // Map 'expert' to 'advanced' for this form
                    } else if (['beginner', 'intermediate', 'advanced'].includes(foundLevel.value)) {
                        prepLevelToSet = foundLevel.value as SyllabusFormData['preparationLevel'];
                    }
                }
            }
            setValue('preparationLevel', prepLevelToSet, { shouldDirty: false });

            setValue('studyMode', data.studyMode || 'self_study', { shouldDirty: false });
            
            const profileWeakTopics = (data.weakSubjects || [])
                .map(idOrName => {
                    const subjectFromMap = subjectsForInitialExam.find(s => s.id === idOrName || s.name === idOrName);
                    return subjectFromMap ? subjectFromMap.id : idOrName; // Prefer ID if found, else keep as is
                })
                .filter(topic => subjectsForInitialExam.some(s => s.id === topic || s.name === topic)); // Ensure it's a valid subject for the exam
            setValue('weakTopics', profileWeakTopics, { shouldDirty: false });

            setValue('preferredLanguage', data.languageMedium || 'english', { shouldDirty: false }); // Map languageMedium to preferredLanguage
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
  }, [currentUser?.uid, setValue, formState.isDirty, toast]); // form.formState.isDirty from methods


  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Syllabus Suggester...</p>
      </div>
    );
  }

  if (!userProfile?.hasCompletedOnboarding) {
    return <OnboardingGate featureName="Syllabus Suggester" hasPaid={true} />;
  }

  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem', transition: { duration: 0.4, ease: "easeInOut" } },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem', transition: { duration: 0.4, ease: "easeInOut" } }
  };

  const onSubmit: SubmitHandler<SyllabusFormData> = async (data) => {
    setIsLoading(true);
    setGeneratedSyllabus(null);
    setOverallFeedback(null);

    // Ensure weakTopics are string IDs/names based on `availableSubjectsForForm`
    const validWeakTopics = (data.weakTopics || []).map(topicOrId => {
        const foundSubject = availableSubjectsForForm.find(s => s.id === topicOrId || s.name === topicOrId);
        return foundSubject ? foundSubject.name : topicOrId;
    }).filter(Boolean);

    // Convert 'expert' to 'advanced' before creating inputForAI
    const preparationLevel = data.preparationLevel === 'expert' ? 'advanced' : data.preparationLevel;

    const inputForAI: SuggestStudyTopicsInput = {
      ...data,
      preparationLevel,
      userName: userProfile?.fullName || currentUser?.displayName || undefined,
      targetDate: format(data.targetDate, 'yyyy-MM-dd'),
      subjects: data.subjects.map(id => availableSubjectsForForm.find(s => s.id === id)?.name || id),
      weakTopics: validWeakTopics,
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

  const predefinedExams = PREDEFINED_EXAMS_CONST.map(exam => ({
    value: exam.value, 
    label: exam.label 
  }));

  return (
    <FormProvider {...methods}> {/* Provide methods to context */}
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
            <Form {...methods}> {/* Pass methods to Form component */}
              <form onSubmit={methods.handleSubmit(onSubmit)}> {/* Use methods.handleSubmit */}
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">Your Study Profile 🧑‍🎓</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Provide details to generate a tailored syllabus. Required fields are marked with <span className="text-destructive">*</span>.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <FormField
                    control={control}
                    name="examType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Exam Type <span className="text-destructive">*</span></FormLabel>
                        <Select 
                            onValueChange={(value) => {
                                field.onChange(value);
                                trigger('subjects'); 
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
                                value={field.value === 'other' ? '' : field.value} // Clear if not 'other', or use specific otherExamName field
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
                    control={control}
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
                      control={control}
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
                              value={field.value === undefined || isNaN(field.value) ? '' : String(field.value)}
                              className="text-sm sm:text-base"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
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
                                  date < new Date(new Date().setDate(new Date().getDate() -1)) // Allow today
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
                      control={control}
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
                      control={control}
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
                    control={control}
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
                    control={control}
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
          {(isLoading && formState.isSubmitted) && (
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
                  examType: getValues('examType'),
                  targetDate: getValues('targetDate'),
                  timeAvailablePerDay: getValues('timeAvailablePerDay'),
                  preparationLevel: (getValues('preparationLevel') === 'expert' ? 'advanced' : getValues('preparationLevel')) as 'beginner' | 'intermediate' | 'advanced'
                }}
              />
            </Suspense>
          )}
           {generatedSyllabus === null && !isLoading && formState.isSubmitted && (
            <Suspense fallback={null}>
              <SyllabusResultDisplay 
                generatedSyllabus={null} 
                overallFeedback={null} 
                formValues={{
                  examType: getValues('examType'),
                  targetDate: getValues('targetDate'),
                  timeAvailablePerDay: getValues('timeAvailablePerDay'),
                  preparationLevel: (getValues('preparationLevel') === 'expert' ? 'advanced' : getValues('preparationLevel')) as 'beginner' | 'intermediate' | 'advanced'
                }} 
              />
            </Suspense>
          )}
        </div>
      </div>
    </FormProvider>
  );
}
