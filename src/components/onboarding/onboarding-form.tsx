
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
  studyMode: z.string().min(1, "Please select your study mode.").optional(),
  examPhase: z.string().min(1, "Please select your current exam phase.").optional(),
  previousAttempts: z.string().min(1, "Please select number of previous attempts").optional(),
});

// Refined schema for step 1 validation (used for triggering step 1 validation)
const step1Schema = baseStep1ObjectSchema.refine(data => {
    if (data.targetExams.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Please specify the exam name if you selected 'Other'.",
    path: ['otherExamName'],
  });

const step2Schema = z.object({
  dailyStudyHours: z.string().min(1, "Please select your daily study hours."),
  preferredStudyTime: z.array(z.string()).min(1, "Select at least one preferred study time."),
  weakSubjects: z.array(z.string()).optional(),
  strongSubjects: z.array(z.string()).optional(),
  distractionStruggles: z.string().optional(),
});

const step3Schema = z.object({
  preferredLearningStyles: z.array(z.string()).min(1, "Select at least one learning style."),
  motivationType: z.string().min(1, "Please select your motivation type."),
  age: z.coerce.number().positive("Age must be a positive number").optional().nullable(),
  location: z.string().optional(),
  socialVisibilityPublic: z.boolean().optional(),
});

// Combine schemas for the full form, merging base objects and then applying refinements if necessary
const fullOnboardingSchema = baseStep1ObjectSchema
  .merge(step2Schema)
  .merge(step3Schema)
  .refine(data => {
    if (data.targetExams.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Please specify the exam name if you selected 'Other'.",
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
    resolver: zodResolver(fullOnboardingSchema), // Use the full schema for the resolver
    mode: 'onChange', 
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
    },
  });

  const { handleSubmit, trigger, getValues } = methods;

  const handleNextStep = async () => {
    let isValid = false;
    // Trigger validation against the specific step's schema or fields
    if (currentStep === 1) {
        // For step 1, we need to ensure the refinement on otherExamName is checked
        // by validating against step1Schema which includes that refinement.
        // However, react-hook-form's trigger validates against the resolver's schema.
        // We'll trigger specific fields and rely on the fullOnboardingSchema's refinement.
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
        // This is for the "Finish Setup" button
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
    if (data.age === null || data.age === undefined || data.age === 0) {
        finalData.age = undefined; 
    }


    const profilePayload: Partial<UserProfileData> = {
      ...finalData, 
      onboardingCompleted: true,
    };
    if (profilePayload.age === undefined) {
        delete profilePayload.age;
    }


    try {
      await setDoc(userProfileRef, profilePayload, { merge: true });
      toast({
        title: 'Profile Setup Complete! 🎉',
        description: "We've saved your preferences. Get ready for a personalized experience!",
      });
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
    <Card className="w-full max-w-xl shadow-2xl">
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
      <CardFooter className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isLoading}>
          Previous
        </Button>
        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNextStep} disabled={isLoading}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Finish Setup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

