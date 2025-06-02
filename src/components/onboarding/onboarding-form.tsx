
'use client';

import React, { useState } from 'react';
import { useForm, FormProvider, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';

import Step1ExamFocus from './step-1-exam-focus';
import Step2StudyHabits from './step-2-study-habits';
import Step3LearningMotivation from './step-3-learning-motivation';

// Base object schema for step 1
const baseStep1ObjectSchema = z.object({
  targetExams: z.array(z.string()).min(1, "Please select at least one target exam."),
  otherExamName: z.string().optional(),
  examAttemptYear: z.string().min(1, "Please select your attempt year."),
  languageMedium: z.string().min(1, "Please select your language medium."),
  studyMode: z.string().optional(),
  examPhase: z.string().optional(),
  previousAttempts: z.string().optional(),
});

// Step 1 schema with refinement
const step1Schema = baseStep1ObjectSchema.refine(data => {
  if (data.targetExams?.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
    return false; 
  }
  return true;
}, {
  message: "Please specify the exam name if 'Other' is selected.",
  path: ['otherExamName'],
});


const step2Schema = z.object({
  dailyStudyHours: z.string().min(1, "Please select your daily study hours."),
  preferredStudyTime: z.array(z.string()).min(1, "Select at least one preferred study time."),
  weakSubjects: z.array(z.string()).optional(),
  strongSubjects: z.array(z.string()).optional(),
  distractionStruggles: z.string().max(500, "Response too long (max 500 chars).").optional(),
});

const step3Schema = z.object({
  preferredLearningStyles: z.array(z.string()).min(1, "Select at least one learning style."),
  motivationType: z.string().min(1, "Please select your motivation type."),
  age: z.coerce.number().positive("Age must be a positive number").min(10, "Age seems too low").max(100, "Age seems too high").optional().nullable(),
  location: z.string().max(100, "Location too long (max 100 chars).").optional(),
  socialVisibilityPublic: z.boolean().optional(),
});

// Combine schemas for the full form
const fullOnboardingSchema = baseStep1ObjectSchema // Use the base object for merging
  .merge(step2Schema)
  .merge(step3Schema)
  .refine(data => { // Re-apply the refinement to the full schema
    if (data.targetExams?.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Please specify the exam name if 'Other' is selected.",
    path: ['otherExamName'],
  });


export type OnboardingFormData = z.infer<typeof fullOnboardingSchema>;

interface OnboardingFormProps {
  userId: string;
  onOnboardingSuccess: () => void;
}

const TOTAL_STEPS = 3;

export default function OnboardingForm({ userId, onOnboardingSuccess }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(fullOnboardingSchema), // Use the full schema for the main resolver
    mode: 'onBlur',
    defaultValues: {
      targetExams: [],
      otherExamName: '',
      examAttemptYear: '',
      languageMedium: '',
      studyMode: '',
      examPhase: '',
      previousAttempts: '',
      dailyStudyHours: '',
      preferredStudyTime: [],
      weakSubjects: [],
      strongSubjects: [],
      distractionStruggles: '',
      preferredLearningStyles: [],
      motivationType: '',
      age: null,
      location: '',
      socialVisibilityPublic: false,
      onboardingCompleted: false, 
    },
  });

  const { handleSubmit, trigger } = methods;

  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
        isValid = await trigger([
            'targetExams', 'otherExamName', 'examAttemptYear',
            'languageMedium', 'studyMode', 'examPhase', 'previousAttempts'
        ]);
    } else if (currentStep === 2) {
        isValid = await trigger([
            'dailyStudyHours', 'preferredStudyTime', 'weakSubjects',
            'strongSubjects', 'distractionStruggles'
        ]);
    } else if (currentStep === 3) { 
        isValid = await trigger([
            'preferredLearningStyles', 'motivationType', 'age',
            'location', 'socialVisibilityPublic'
        ]);
    }


    if (isValid && currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else if (isValid && currentStep === TOTAL_STEPS) {
        await handleSubmit(onSubmit)();
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    setIsLoading(true);
    const userProfileRef = doc(db, 'users', userId, 'userProfile', 'profile');

    const finalData = { ...data };
    if (!data.targetExams?.includes('other')) {
      finalData.otherExamName = '';
    }
    if (finalData.age === null || finalData.age === 0) {
        delete (finalData as any).age; 
    }

    const profilePayload: Partial<UserProfileData> = {
      ...finalData,
      onboardingCompleted: true,
    };
    
    try {
      await setDoc(userProfileRef, profilePayload, { merge: true });
      onOnboardingSuccess();
    } catch (error: any) {
      console.error('Error saving onboarding data:', error);
      toast({
        title: 'Error Saving Profile',
        description: error.message || 'Could not save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progressValue = (currentStep / TOTAL_STEPS) * 100;

  return (
    <Card className="w-full max-w-xl shadow-2xl my-8">
      <CardHeader className="text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary mb-2" />
        <CardTitle className="text-2xl md:text-3xl font-bold">Personalize Your StudyTrack</CardTitle>
        <CardDescription>
          Tell us a bit about yourself to tailor your learning journey. (Step {currentStep} of {TOTAL_STEPS})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={progressValue} className="mb-8 h-3" />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && <Step1ExamFocus />}
            {currentStep === 2 && <Step2StudyHabits />}
            {currentStep === 3 && <Step3LearningMotivation />}
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between pt-6 border-t gap-3 sm:gap-0">
        <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isLoading} className="w-full sm:w-auto">
          Previous
        </Button>
        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNextStep} disabled={isLoading} className="w-full sm:w-auto">
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finish Setup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
