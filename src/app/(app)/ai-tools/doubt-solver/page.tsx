
'use client';

import React, { useState, useEffect } from 'react';
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
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import OnboardingRequiredGate from '@/components/onboarding/OnboardingRequiredGate'; // Import the gate


const doubtSolverFormSchema = z.object({
  userQuery: z.string().min(5, { message: 'Question must be at least 5 characters.' }).max(500, { message: 'Question is too long (max 500 characters).' }),
  subjectContext: z.string().min(2, { message: 'Subject must be at least 2 characters.'}).max(50, { message: 'Subject name too long.'}).optional(),
});

type DoubtSolverFormData = z.infer<typeof doubtSolverFormSchema>;

export default function DoubtSolverPage() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<SolveAcademicDoubtOutput | null>(null);
  const { toast } = useToast();
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const form = useForm<DoubtSolverFormData>({
    resolver: zodResolver(doubtSolverFormSchema),
    defaultValues: {
      userQuery: '',
      subjectContext: '',
    },
  });
  
  useEffect(() => {
    async function fetchUserProfile() {
      if (currentUser?.uid) {
        setIsLoadingProfile(true);
        const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
        const profileSnap = await getDoc(profileDocRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserProfile(data);
          setOnboardingCompleted(data.onboardingCompleted || false);
          // Pre-fill subject context if available from user's primary interests
          if (data.onboardingCompleted && data.subjectDetails && data.subjectDetails.length > 0) {
             form.setValue('subjectContext', data.subjectDetails[0].subjectName);
          } else if (data.onboardingCompleted && data.targetExams && data.targetExams.length > 0) {
            // Fallback to exam type as context if no specific subjects
            const primaryExam = data.targetExams[0] === 'other' && data.otherExamName ? data.otherExamName : data.targetExams[0];
            form.setValue('subjectContext', primaryExam);
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
    fetchUserProfile();
  }, [currentUser, form]);


  const onSubmit: SubmitHandler<DoubtSolverFormData> = async (data) => {
    setIsLoading(true);
    setAiResponse(null);

    const aiInput: SolveAcademicDoubtInput = {
      userQuery: data.userQuery,
      userName: userProfile?.fullName || currentUser?.displayName || undefined,
      examType: userProfile?.targetExams && userProfile.targetExams.length > 0 
                ? (userProfile.targetExams[0] === 'other' && userProfile.otherExamName ? userProfile.otherExamName : userProfile.targetExams[0])
                : undefined,
      subjectContext: data.subjectContext || undefined, // Use form input first
      preparationLevel: userProfile?.subjectDetails && userProfile.subjectDetails.length > 0 
                        ? userProfile.subjectDetails[0].preparationLevel // Simplistic: uses first subject's level
                        : undefined, // Or a general level from profile if available
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

  if (!onboardingCompleted) {
    return <OnboardingRequiredGate featureName="AI Doubt Solver" />;
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
