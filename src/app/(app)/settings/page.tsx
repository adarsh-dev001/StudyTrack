
'use client';

import React, { useEffect, useState } from 'react';
import { useForm, type SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateProfile as updateFirebaseAuthProfile } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import {
  TARGET_EXAMS,
  EXAM_ATTEMPT_YEARS,
  LANGUAGE_MEDIUMS,
  DAILY_STUDY_HOURS_OPTIONS,
  PREFERRED_STUDY_TIMES,
  SUBJECT_OPTIONS,
  PREFERRED_LEARNING_STYLES,
  MOTIVATION_TYPES,
  STUDY_MODES,
  EXAM_PHASES,
} from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


const settingsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  email: z.string().email('Invalid email address').optional(), // Usually not editable directly

  targetExams: z.array(z.string()).min(1, "Please select at least one target exam.").optional(),
  otherExamName: z.string().optional(),
  examAttemptYear: z.string().min(1, "Please select your attempt year.").optional(),
  languageMedium: z.string().min(1, "Please select your language medium.").optional(),
  studyMode: z.string().optional(),
  examPhase: z.string().optional(),
  
  dailyStudyHours: z.string().min(1, "Please select your daily study hours.").optional(),
  preferredStudyTime: z.array(z.string()).min(1, "Select at least one preferred study time.").optional(),
  weakSubjects: z.array(z.string()).optional(),
  strongSubjects: z.array(z.string()).optional(),
  
  preferredLearningStyles: z.array(z.string()).min(1, "Select at least one learning style.").optional(),
  motivationType: z.string().min(1, "Please select your motivation type.").optional(),
  
  onboardingCompleted: z.boolean().optional(),
}).refine(data => {
    if (data.targetExams?.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
      return false; 
    }
    return true;
  }, {
    message: "Please specify the exam name if 'Other' is selected.",
    path: ['otherExamName'],
  });

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  
  const methods = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
      targetExams: [],
      otherExamName: '',
      examAttemptYear: '',
      languageMedium: '',
      studyMode: '',
      examPhase: '',
      dailyStudyHours: '',
      preferredStudyTime: [],
      weakSubjects: [],
      strongSubjects: [],
      preferredLearningStyles: [],
      motivationType: '',
    },
  });

  const { handleSubmit, control, reset, watch, formState: { isSubmitting, dirtyFields } } = methods;
  const watchedTargetExams = watch('targetExams');

  useEffect(() => {
    if (currentUser) {
      setIsProfileLoading(true);
      const profileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      getDoc(profileRef).then(docSnap => {
        const profileData = docSnap.exists() ? docSnap.data() as UserProfileData : {};
        reset({
          fullName: currentUser.displayName || profileData.fullName || '',
          email: currentUser.email || '',
          targetExams: profileData.targetExams || [],
          otherExamName: profileData.otherExamName || '',
          examAttemptYear: profileData.examAttemptYear || '',
          languageMedium: profileData.languageMedium || '',
          studyMode: profileData.studyMode || '',
          examPhase: profileData.examPhase || '',
          dailyStudyHours: profileData.dailyStudyHours || '',
          preferredStudyTime: profileData.preferredStudyTime || [],
          weakSubjects: profileData.weakSubjects || [],
          strongSubjects: profileData.strongSubjects || [],
          preferredLearningStyles: profileData.preferredLearningStyles || [],
          motivationType: profileData.motivationType || '',
        });
      }).catch(error => {
        console.error("Error fetching profile for settings:", error);
        toast({ title: "Error", description: "Could not load your profile details.", variant: "destructive"});
      }).finally(() => {
        setIsProfileLoading(false);
      });
    }
  }, [currentUser, reset, toast]);

  const onSubmit: SubmitHandler<SettingsFormData> = async (data) => {
    if (!currentUser || !auth) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
      return;
    }

    try {
      if (data.fullName && data.fullName !== currentUser.displayName) {
         await updateFirebaseAuthProfile(currentUser, { displayName: data.fullName });
      }
      
      const userProfileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      const firestorePayload: Partial<UserProfileData> = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key) && (data as any)[key] !== undefined) {
          (firestorePayload as any)[key] = (data as any)[key];
        }
      }
      if (!firestorePayload.targetExams?.includes('other')) {
        firestorePayload.otherExamName = ''; // Clear if 'other' not selected
      }
      
      await setDoc(userProfileRef, firestorePayload, { merge: true });

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been successfully updated.',
      });
      reset(data); 
       
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  if (authLoading || isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account and application preferences.</p>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField control={control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel htmlFor="fullName">Full Name</FormLabel><FormControl><Input id="fullName" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="email" render={({ field }) => (
                  <FormItem><FormLabel htmlFor="email">Email Address</FormLabel><FormControl><Input id="email" type="email" {...field} disabled /></FormControl><FormDescription>Email address cannot be changed here.</FormDescription><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Exam Focus</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={control} name="targetExams" render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Target Exam(s)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2">
                      {TARGET_EXAMS.map((exam) => (
                        <FormField key={exam.value} control={control} name="targetExams" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(exam.value)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), exam.value] : (field.value || []).filter((v) => v !== exam.value))} /></FormControl>
                              <FormLabel className="font-normal text-sm">{exam.label}</FormLabel>
                            </FormItem>)} />
                      ))}
                    </div><FormMessage />
                  </FormItem>)} />
              {watchedTargetExams?.includes('other') && (
                <FormField control={control} name="otherExamName" render={({ field }) => (
                    <FormItem><FormLabel>Specify Other Exam</FormLabel><FormControl><Input placeholder="E.g., GRE, GMAT" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              )}
              <FormField control={control} name="examAttemptYear" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Attempt Year</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger></FormControl><SelectContent>{EXAM_ATTEMPT_YEARS().map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="languageMedium" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Language Medium</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger></FormControl><SelectContent>{LANGUAGE_MEDIUMS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="studyMode" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Study Mode</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select study mode" /></SelectTrigger></FormControl><SelectContent>{STUDY_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="examPhase" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Current Exam Phase</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select phase" /></SelectTrigger></FormControl><SelectContent>{EXAM_PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Study Habits</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={control} name="dailyStudyHours" render={({ field }) => (
                <FormItem><FormLabel className="font-semibold">Daily Study Hours</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger></FormControl><SelectContent>{DAILY_STUDY_HOURS_OPTIONS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={control} name="preferredStudyTime" render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Preferred Study Time(s)</FormLabel>
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2">
                      {PREFERRED_STUDY_TIMES.map((time) => (
                        <FormField key={time.id} control={control} name="preferredStudyTime" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(time.id)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), time.id] : (field.value || []).filter((v) => v !== time.id))} /></FormControl>
                              <FormLabel className="font-normal text-sm">{time.label}</FormLabel>
                            </FormItem>)} />
                      ))}</div><FormMessage />
                  </FormItem>)} />
              <FormField control={control} name="weakSubjects" render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Weak Subject(s)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 pt-2">
                      {SUBJECT_OPTIONS.map((subject) => (
                        <FormField key={subject.id + "-weak"} control={control} name="weakSubjects" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(subject.id)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), subject.id] : (field.value || []).filter((v) => v !== subject.id))} /></FormControl>
                              <FormLabel className="font-normal text-sm">{subject.label}</FormLabel>
                            </FormItem>)} />
                      ))}</div><FormMessage />
                  </FormItem>)} />
              <FormField control={control} name="strongSubjects" render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Strong Subject(s)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-3 pt-2">
                      {SUBJECT_OPTIONS.map((subject) => (
                        <FormField key={subject.id + "-strong"} control={control} name="strongSubjects" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(subject.id)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), subject.id] : (field.value || []).filter((v) => v !== subject.id))} /></FormControl>
                              <FormLabel className="font-normal text-sm">{subject.label}</FormLabel>
                            </FormItem>)} />
                      ))}</div><FormMessage />
                  </FormItem>)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-xl">Learning & Motivation</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <FormField control={control} name="preferredLearningStyles" render={() => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Preferred Learning Style(s)</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2">
                      {PREFERRED_LEARNING_STYLES.map((style) => (
                         <FormField key={style.id} control={control} name="preferredLearningStyles" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl><Checkbox checked={field.value?.includes(style.id)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), style.id] : (field.value || []).filter((v) => v !== style.id))} /></FormControl>
                              <FormLabel className="font-normal text-sm">{style.label}</FormLabel>
                            </FormItem>)} />
                      ))}</div><FormMessage />
                  </FormItem>)} />
              <FormField control={control} name="motivationType" render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="font-semibold">Primary Motivation</FormLabel>
                    <FormControl><RadioGroup onValueChange={field.onChange} value={field.value || ''} className="flex flex-col space-y-1">
                        {MOTIVATION_TYPES.map(type => (
                          <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value={type.value} /></FormControl><FormLabel className="font-normal text-sm">{type.label}</FormLabel>
                          </FormItem>))}
                    </RadioGroup></FormControl><FormMessage />
                  </FormItem>)} />
            </CardContent>
          </Card>

          <div className="flex justify-start pt-2">
             <Button type="submit" size="lg" disabled={isSubmitting || Object.keys(dirtyFields).length === 0}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save All Settings'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
