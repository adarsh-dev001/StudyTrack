
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2, MessageSquareQuestion, Brain, CheckCircle, Sparkles } from 'lucide-react';
import { solveAcademicDoubt, type SolveAcademicDoubtInput, type SolveAcademicDoubtOutput } from '@/ai/flows/solve-academic-doubt-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';


const doubtSolverFormSchema = z.object({
  userQuery: z.string().min(5, { message: 'Question must be at least 5 characters.' }).max(500, { message: 'Question is too long (max 500 characters).' }),
  subjectContext: z.string().min(2, { message: 'Subject must be at least 2 characters.'}).max(50, { message: 'Subject name too long.'}).optional(),
});

type DoubtSolverFormData = z.infer<typeof doubtSolverFormSchema>;

function OnboardingFormFallback() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
      <Skeleton className="h-4 w-full mb-6" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default function DoubtSolverPage() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<SolveAcademicDoubtOutput | null>(null);
  const { toast } = useToast();
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const form = useForm<DoubtSolverFormData>({
    resolver: zodResolver(doubtSolverFormSchema),
    defaultValues: {
      userQuery: '',
      subjectContext: '',
    },
  });
  
  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserProfile(data);
          if (!data.onboardingCompleted) {
            setShowOnboardingModal(true);
          } else {
            setShowOnboardingModal(false);
            if (data.subjectDetails && data.subjectDetails.length > 0) {
              form.setValue('subjectContext', data.subjectDetails[0].subjectName);
            } else if (data.targetExams && data.targetExams.length > 0) {
              const primaryExam = data.targetExams[0] === 'other' && data.otherExamName ? data.otherExamName : data.targetExams[0];
              form.setValue('subjectContext', primaryExam);
            }
          }
        } else {
          setUserProfile(null);
          setShowOnboardingModal(true); 
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

  const handleOnboardingSuccess = () => {
    setShowOnboardingModal(false);
    // Profile state will update via onSnapshot, and then fields might be pre-filled
  };


  const onSubmit: SubmitHandler<DoubtSolverFormData> = async (data) => {
    setIsLoading(true);
    setAiResponse(null);

    const aiInput: SolveAcademicDoubtInput = {
      userQuery: data.userQuery,
      userName: userProfile?.fullName || currentUser?.displayName || undefined,
      examType: userProfile?.targetExams && userProfile.targetExams.length > 0 
                ? (userProfile.targetExams[0] === 'other' && userProfile.otherExamName ? userProfile.otherExamName : userProfile.targetExams[0])
                : undefined,
      subjectContext: data.subjectContext || userProfile?.subjectDetails?.[0]?.subjectName || undefined,
      preparationLevel: userProfile?.subjectDetails && userProfile.subjectDetails.length > 0 
                        ? userProfile.subjectDetails[0].preparationLevel 
                        : undefined, 
    };

    try {
      const result = await solveAcademicDoubt(aiInput);
      setAiResponse(result);
      toast({
        title: '💡 Answer Generated!',
        description: "The AI has provided an explanation for your doubt.",
      });
    } catch (error: any) {
      console.error('Error solving academic doubt:', error);
      toast({
        title: 'Error Getting Answer 😥',
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
        <p className="text-muted-foreground">Loading AI Doubt Solver...</p>
      </div>
    );
  }

  if (showOnboardingModal && currentUser) {
    return (
      <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-4 sm:p-6 border-b text-center shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Complete Profile for AI Doubt Solver</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Please complete your profile to get personalized help from the AI Doubt Solver.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-grow min-h-0">
            <div className="p-4 sm:p-6">
             <Suspense fallback={<OnboardingFormFallback />}>
                <OnboardingForm userId={currentUser.uid} onOnboardingSuccess={handleOnboardingSuccess} />
             </Suspense>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <MessageSquareQuestion className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Doubt Solver
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Got a tricky question? Ask our AI assistant for a personalized explanation. 🧑‍🏫
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Ask Your Academic Question</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Be specific! The more context you provide, the better the AI can help.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="userQuery"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Your Question <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Explain Newton's third law with examples, or Why is the sky blue?"
                        className="min-h-[100px] sm:min-h-[120px] resize-y text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subjectContext"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Subject Context (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Physics, Indian History, Organic Chemistry" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      Mentioning the subject helps the AI give a more relevant answer.
                    </FormDescription>
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
                    Getting Answer...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Submit Question
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {isLoading && !aiResponse && (
        <div className="flex flex-col items-center justify-center text-center p-6 sm:p-10 border-2 border-dashed border-primary/30 rounded-lg bg-primary/5 min-h-[150px] sm:min-h-[200px]">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary mb-3 sm:mb-4" />
            <p className="text-sm sm:text-md font-semibold text-primary">AI is thinking... 🧠</p>
            <p className="text-xs text-muted-foreground mt-1">Crafting your personalized explanation.</p>
        </div>
      )}

      {aiResponse && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader className="p-4 sm:p-6 bg-secondary/30 rounded-t-lg">
            <CardTitle className="text-lg sm:text-xl font-semibold flex items-center">
                <Brain className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> AI's Explanation
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Here's what our AI assistant came up with for your question.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <Alert variant="default" className="bg-card">
              <Sparkles className="h-5 w-5 text-accent" />
              <AlertTitle className="font-semibold text-accent">Explanation:</AlertTitle>
              <AlertDescription className="prose prose-sm dark:prose-invert max-w-none text-foreground mt-1">
                <div dangerouslySetInnerHTML={{ __html: aiResponse.explanation.replace(/\n/g, '<br />') }} />
              </AlertDescription>
            </Alert>

            {aiResponse.relatedTopics && aiResponse.relatedTopics.length > 0 && (
              <div className="p-3 sm:p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm sm:text-md text-foreground mb-1.5 sm:mb-2">Related Topics to Explore:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
                  {aiResponse.relatedTopics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiResponse.confidenceScore !== undefined && (
                 <div className="text-xs text-muted-foreground text-right pt-2">
                    AI Confidence: {(aiResponse.confidenceScore * 100).toFixed(0)}%
                </div>
            )}
          </CardContent>
           <CardFooter className="pt-3 sm:pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Remember: AI explanations are a helpful starting point. Always cross-verify critical information with trusted sources.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

