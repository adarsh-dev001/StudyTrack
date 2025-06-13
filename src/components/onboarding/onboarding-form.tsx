
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, FormProvider, type SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { UserProfileData } from '@/lib/profile-types';
import { DEFAULT_THEME_ID } from '@/lib/themes';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';

const Step1PersonalInfo = React.lazy(() => import('./Step1PersonalInfo'));
const Step2TargetExam = React.lazy(() => import('./Step2TargetExam'));
const Step3QuickSetup = React.lazy(() => import('./Step3QuickSetup')); // New Step 3

// --- Zod Schemas for each step and the full form ---
const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(100, 'Full name too long.'),
  languageMedium: z.string().min(1, "Please select your language medium."),
});

const step2Schema = z.object({
  targetExams: z.array(z.string()).min(1, "Select at least one target exam."),
  otherExamName: z.string().optional(),
});

const step3Schema = z.object({
  preparationLevel: z.string().min(1, "Please select your preparation level."), // Maps to general prep level
});

const fullOnboardingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .refine(data => {
    if (data.targetExams?.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Please specify the exam name if 'Other' is selected.",
    path: ['otherExamName'],
  });

export type OnboardingFormData = z.infer<typeof fullOnboardingSchema>;

const TOTAL_STEPS = 3; // Updated to 3 steps

const stepTitles = [
  "Welcome! Let's Start with Basics", // Step 1
  "What's Your Goal?",               // Step 2
  "Your Current Stage"               // Step 3
];

function OnboardingStepSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

interface OnboardingFormProps {
  userId?: string; 
  onComplete: () => void; 
}

function OnboardingFormComponent({ userId, onComplete }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth(); 

  const actualUserId = userId || currentUser?.uid; 

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(fullOnboardingSchema), 
    mode: 'onTouched', 
    defaultValues: {
      fullName: '',
      languageMedium: '',
      targetExams: [],
      otherExamName: '',
      preparationLevel: '',
    },
  });

  const { handleSubmit, trigger, getValues, formState: { errors, dirtyFields }, reset } = methods;

  useEffect(() => {
    if (actualUserId) {
      const profileRef = doc(db, 'users', actualUserId, 'userProfile', 'profile');
      getDoc(profileRef).then(docSnap => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfileData;
          if (Object.keys(dirtyFields).length === 0) {
            methods.reset({
              fullName: profileData.fullName || auth.currentUser?.displayName || '',
              languageMedium: profileData.languageMedium || '',
              targetExams: profileData.targetExams || [],
              otherExamName: profileData.otherExamName || '',
              preparationLevel: profileData.preparationLevel || '',
            });
          }
        }
      }).catch(error => {
        console.error("Error fetching profile for onboarding prefill:", error);
        toast({ title: "Error", description: "Could not load existing profile data.", variant: "destructive"});
      });
    }
  }, [actualUserId, methods, dirtyFields, toast]);

  const getBaseSchemaForStep = (step: number) => {
    if (step === 1) return step1Schema;
    if (step === 2) return step2Schema;
    if (step === 3) return step3Schema;
    return fullOnboardingSchema; 
  };

  const handleNextStep = async () => {
    const baseSchemaForCurrentStep = getBaseSchemaForStep(currentStep);
    const fieldsToValidate = Object.keys(baseSchemaForCurrentStep.shape) as Array<keyof OnboardingFormData>;
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
      } else { // This is now the submit action on the last step
        await handleSubmit(onSubmit)();
      }
    } else {
      toast({
        title: "Hold Up!",
        description: "Please fill out all required fields correctly before proceeding.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    if (!actualUserId) { 
        toast({ title: "Error", description: "User ID not found. Please try logging in again.", variant: "destructive" });
        setIsLoading(false); 
        return;
    }
    setIsLoading(true);
    const userProfileRef = doc(db, 'users', actualUserId, 'userProfile', 'profile');

    let finalData = { ...data };
    if (!finalData.targetExams?.includes('other')) {
      finalData.otherExamName = '';
    }

    const existingProfileSnap = await getDoc(userProfileRef);
    const existingProfileData = existingProfileSnap.exists() ? existingProfileSnap.data() as UserProfileData : {};

    const profilePayload: Partial<UserProfileData> = {
      ...existingProfileData, // Preserve existing data
      fullName: finalData.fullName,
      languageMedium: finalData.languageMedium,
      targetExams: finalData.targetExams,
      otherExamName: finalData.otherExamName,
      preparationLevel: finalData.preparationLevel,
      quickOnboardingCompleted: true, // Mark quick onboarding as done
      hasCompletedOnboarding: existingProfileData.hasCompletedOnboarding || false, // Preserve full onboarding status
      // Ensure essential fields from UserProfileData are initialized if not present
      email: auth.currentUser?.email || existingProfileData.email || '',
      coins: existingProfileData.coins || 0,
      xp: existingProfileData.xp || 0,
      earnedBadgeIds: existingProfileData.earnedBadgeIds || [],
      purchasedItemIds: existingProfileData.purchasedItemIds || [],
      activeThemeId: existingProfileData.activeThemeId === undefined ? DEFAULT_THEME_ID : existingProfileData.activeThemeId,
      dailyChallengeStatus: existingProfileData.dailyChallengeStatus || {},
      lastInteractionDates: existingProfileData.lastInteractionDates || [],
    };

    try {
      await setDoc(userProfileRef, profilePayload, { merge: true });
      if (auth.currentUser && data.fullName && data.fullName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: data.fullName });
      }
      onComplete(); 
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <Step1PersonalInfo />;
      case 2: return <Step2TargetExam />;
      case 3: return <Step3QuickSetup />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-xl shadow-2xl border-0">
      <CardHeader className="text-center p-4 sm:p-6">
        <Sparkles className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-1 sm:mb-2" />
        <CardTitle className="text-xl sm:text-2xl md:text-2xl font-bold">
          {stepTitles[currentStep -1]}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Step {currentStep} of {TOTAL_STEPS}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Progress value={progressValue} className="mb-6 sm:mb-8 h-2 sm:h-2.5" />
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5 sm:space-y-6 min-h-[200px] sm:min-h-[250px]"> 
              <Suspense fallback={<OnboardingStepSkeleton />}>
                {renderStepContent()}
              </Suspense>
            </div>
          </form>
        </FormProvider>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between pt-5 sm:pt-6 border-t p-4 sm:p-6 gap-3">
        <Button variant="outline" onClick={handlePrevStep} disabled={currentStep === 1 || isLoading} className="w-full sm:w-auto text-sm sm:text-base">
          <ChevronLeft className="mr-1.5 h-4 w-4"/> Previous
        </Button>
        <Button onClick={handleNextStep} disabled={isLoading} className="w-full sm:w-auto text-sm sm:text-base">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {currentStep < TOTAL_STEPS ? (
            <>Next <ChevronRight className="ml-1.5 h-4 w-4"/></>
          ) : (
            isLoading? 'Finishing Up...' : 'Finish Setup & Explore'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default React.memo(OnboardingFormComponent);
