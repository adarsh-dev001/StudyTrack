
'use client';

import React, { useState, Suspense } from 'react';
import { useForm, FormProvider, type SubmitHandler, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import type { UserProfileData } from '@/lib/profile-types'; 
import { subjectDetailSchema } from '@/lib/profile-types'; 
import { Skeleton } from '@/components/ui/skeleton';
import { EXAM_SUBJECT_MAP } from '@/lib/constants';

const Step1PersonalInfo = React.lazy(() => import('./Step1PersonalInfo'));
const Step2TargetExam = React.lazy(() => import('./Step2TargetExam'));
const Step3SubjectDetails = React.lazy(() => import('./Step3SubjectDetails'));
const Step4StudyPreferences = React.lazy(() => import('./Step4StudyPreferences'));
const Step5Review = React.lazy(() => import('./Step5Review'));

// --- Zod Schemas for each step and the full form ---
const step1BaseSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters.').max(100, 'Full name too long.'),
  age: z.coerce.number().positive("Age must be positive.").min(10, "Age seems too low.").max(100, "Age seems too high.").optional().nullable(),
  location: z.string().max(100, "Location too long.").optional(),
  languageMedium: z.string().min(1, "Please select your language medium."),
  studyMode: z.string().optional(),
  examPhase: z.string().optional(),
  previousAttempts: z.string().optional(),
});

const step2BaseSchema = z.object({
  targetExams: z.array(z.string()).min(1, "Select at least one target exam."),
  otherExamName: z.string().optional(),
  examAttemptYear: z.string().min(1, "Select your attempt year."),
});

const step3BaseSchema = z.object({
  subjectDetails: z.array(subjectDetailSchema).min(1, "Please provide details for at least one subject.").optional(),
});

const step4BaseSchema = z.object({
  dailyStudyHours: z.string().min(1, "Select daily study hours."),
  preferredStudyTime: z.array(z.string()).min(1, "Select at least one preferred study time."),
  distractionStruggles: z.string().max(500, "Response too long.").optional(),
  motivationType: z.string().min(1, "Select your motivation type."),
  socialVisibilityPublic: z.boolean().optional(),
});

// Merge base schemas first
const mergedBaseSchema = step1BaseSchema
  .merge(step2BaseSchema)
  .merge(step3BaseSchema)
  .merge(step4BaseSchema);

// Apply refinements to the merged schema
const fullOnboardingSchema = mergedBaseSchema.refine(data => {
  if (data.targetExams?.includes('other') && (!data.otherExamName || data.otherExamName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "Please specify the exam name if 'Other' is selected.",
  path: ['otherExamName'],
});

export type OnboardingFormData = z.infer<typeof fullOnboardingSchema>;

// --- Helper to get current step's BASE schema for field name extraction ---
const getBaseSchemaForStep = (step: number) => {
  if (step === 1) return step1BaseSchema;
  if (step === 2) return step2BaseSchema;
  if (step === 3) return step3BaseSchema; // Use step3BaseSchema for validation logic
  if (step === 4) return step4BaseSchema;
  return fullOnboardingSchema; 
};

const TOTAL_STEPS = 5;

const stepTitles = [
  "Personal & Academic Basics",
  "Your Exam Focus",
  "Subject Deep Dive",
  "Study Habits & Preferences",
  "Review Your Profile"
];

function OnboardingStepSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
          {i % 2 === 0 && <Skeleton className="h-4 w-2/3" />}
        </div>
      ))}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export default function OnboardingForm({ userId, onOnboardingSuccess }: { userId: string; onOnboardingSuccess: () => void; }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(fullOnboardingSchema),
    mode: 'onTouched', // Validate on blur/touch
    defaultValues: {
      fullName: '',
      age: null,
      location: '',
      languageMedium: '',
      studyMode: '',
      examPhase: '',
      previousAttempts: '',
      targetExams: [],
      otherExamName: '',
      examAttemptYear: '',
      subjectDetails: [],
      dailyStudyHours: '',
      preferredStudyTime: [],
      distractionStruggles: '',
      motivationType: '',
      socialVisibilityPublic: false,
    },
  });

  const { handleSubmit, trigger, getValues, control, setValue } = methods;
  const watchedTargetExams = useWatch({ control, name: 'targetExams' });

  React.useEffect(() => {
    if (watchedTargetExams && watchedTargetExams.length > 0) {
      const primaryExam = watchedTargetExams[0]; 
      const subjectsForExam = EXAM_SUBJECT_MAP[primaryExam] || EXAM_SUBJECT_MAP['other'];
      
      const currentSubjectDetailsArray = getValues('subjectDetails') || [];
      
      const newSubjectDetails = subjectsForExam.map(examSubject => {
        const existingDetail = currentSubjectDetailsArray.find(sd => sd.subjectId === examSubject.id);
        return existingDetail || {
          subjectId: examSubject.id,
          subjectName: examSubject.name,
          preparationLevel: '',
          targetScore: '',
          preferredLearningMethods: [],
        };
      });

      const currentSubjectIds = currentSubjectDetailsArray.map(sd => sd.subjectId).sort().join(',');
      const newSubjectIds = newSubjectDetails.map(sd => sd.subjectId).sort().join(',');

      if (currentSubjectIds !== newSubjectIds || currentSubjectDetailsArray.length !== newSubjectDetails.length) {
        setValue('subjectDetails', newSubjectDetails, { shouldValidate: currentStep === 3, shouldDirty: true });
      }
    } else if (watchedTargetExams && watchedTargetExams.length === 0) {
      // Clear subjectDetails if no exam is selected
      if (getValues('subjectDetails')?.length > 0) {
          setValue('subjectDetails', [], { shouldValidate: currentStep === 3, shouldDirty: true });
      }
    }
  }, [watchedTargetExams, setValue, getValues, currentStep]);


  const handleNextStep = async () => {
    if (currentStep === TOTAL_STEPS) { // If on the review step, next action is submit
        await handleSubmit(onSubmit)();
        return;
    }
    // Get the Zod schema for the current step's fields
    const baseSchemaForCurrentStep = getBaseSchemaForStep(currentStep);
    const fieldsToValidate = Object.keys(baseSchemaForCurrentStep.shape) as Array<keyof OnboardingFormData>;
    
    let isValid = await trigger(fieldsToValidate);

    // Special handling for step 3 (subjectDetails) if it's optional but not empty
    if (currentStep === 3 && baseSchemaForCurrentStep.shape.subjectDetails?.isOptional()) {
        const subjectDetailsValue = getValues('subjectDetails');
        if (subjectDetailsValue && subjectDetailsValue.length > 0) {
            // If subjectDetails is optional but has entries, validate it specifically
            const subjectDetailsValid = await trigger(['subjectDetails']);
            isValid = isValid && subjectDetailsValid;
        } else {
             // If subjectDetails is optional and empty, it's considered valid for this step's progression
             // (assuming the main schema allows it to be optional)
        }
    }


    if (isValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(prev => prev + 1);
      }
    } else {
      toast({
        title: "Hold Up!",
        description: "Please fill out all required fields correctly before proceeding.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const onSubmit: SubmitHandler<OnboardingFormData> = async (data) => {
    setIsLoading(true);
    const userProfileRef = doc(db, 'users', userId, 'userProfile', 'profile');

    // Ensure data transformations (like for 'age') are done before saving
    let finalData = { ...data };
    if (!finalData.targetExams?.includes('other')) {
      finalData.otherExamName = ''; // Clear otherExamName if 'Other' is not selected
    }
     if (finalData.age === null || finalData.age === 0 || isNaN(Number(finalData.age))) {
        // If age is null, 0, or NaN, ensure it's stored as null or omitted.
        // Firestore can handle nulls. If you want to omit, use `delete (finalData as any).age;`
        finalData.age = null; 
    } else {
        finalData.age = Number(finalData.age); // Ensure it's a number
    }
    
    // Ensure subjectDetails is an array, even if empty
    finalData.subjectDetails = finalData.subjectDetails || [];

    const profilePayload: Partial<UserProfileData> = {
      ...finalData,
      onboardingCompleted: true, // Mark onboarding as completed
    };

    try {
      await setDoc(userProfileRef, profilePayload, { merge: true }); // Use merge to update existing doc or create if not exists
      if (auth.currentUser && data.fullName) { // Update Firebase Auth display name if provided
        await updateProfile(auth.currentUser, { displayName: data.fullName });
      }
      onOnboardingSuccess(); // Callback to notify parent component (e.g., to close modal)
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
      case 3: return <Step3SubjectDetails selectedExam={getValues('targetExams')?.[0]} />;
      case 4: return <Step4StudyPreferences />;
      case 5: return <Step5Review formData={getValues()} />;
      default: return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl shadow-2xl"> {/* Removed my-4 sm:my-8 */}
      <CardHeader className="text-center p-4 sm:p-6">
        <Sparkles className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-1 sm:mb-2" />
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">
          {stepTitles[currentStep -1]}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Step {currentStep} of {TOTAL_STEPS}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Progress value={progressValue} className="mb-6 sm:mb-8 h-2.5 sm:h-3" />
        <FormProvider {...methods}>
          {/* Removed Framer Motion AnimatePresence and motion.div for simplicity and to ensure scrolling */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
            <div>
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
        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNextStep} disabled={isLoading} className="w-full sm:w-auto text-sm sm:text-base">
            Next <ChevronRight className="ml-1.5 h-4 w-4"/>
          </Button>
        ) : (
          <Button onClick={handleSubmit(onSubmit)} disabled={isLoading} className="w-full sm:w-auto text-sm sm:text-base bg-green-600 hover:bg-green-700">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm & Finish Setup'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
    