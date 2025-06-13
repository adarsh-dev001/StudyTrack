'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Wand2, Sparkles, Youtube, FileText, Download, BookText, AlertTriangle, Edit } from 'lucide-react';
import {
  processYouTubeVideo,
  type ProcessYouTubeVideoInput,
  type ProcessYouTubeVideoOutput,
} from '@/ai/flows/process-youtube-video-flow';
import { ProcessYouTubeVideoInputSchema as PageLevelInputSchema } from '@/ai/schemas/youtube-processing-schemas';

import type { MCQ } from '@/ai/flows/summarize-study-material';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { recordPlatformInteraction } from '@/lib/activity-utils';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion'; // Added framer-motion
import OnboardingGate from '@/components/onboarding/OnboardingRequiredGate.tsx';

const YouTubeSummarizerResultsDisplay = React.lazy(() => import('@/components/ai-tools/youtube-summarizer/YouTubeSummarizerResultsDisplay'));
const YouTubeSummarizerResultsDisplayFallback = React.lazy(() => import('@/components/ai-tools/youtube-summarizer/YouTubeSummarizerResultsDisplayFallback'));

const youtubeSummarizerFormSchema = PageLevelInputSchema.pick({
  youtubeUrl: true,
  videoTranscript: true,
  customTitle: true,
});


type YouTubeSummarizerFormData = z.infer<typeof youtubeSummarizerFormSchema>;

interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

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

export default function YouTubeSummarizerPage() {
  const { currentUser } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<ProcessYouTubeVideoOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false);
  const [fetchTranscriptError, setFetchTranscriptError] = useState<string | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, MCQWithUserAnswer>>({});
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userFullProfile, setUserFullProfile] = useState<UserProfileData | null>(null);
  const [isInputFormCollapsed, setIsInputFormCollapsed] = useState(false);

  useEffect(() => {
    if (analysisResult && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [analysisResult]);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    if (currentUser?.uid) {
      setIsLoadingProfile(true);
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      unsubscribeProfile = onSnapshot(profileDocRef, (profileSnap) => {
        if (profileSnap.exists()) {
          const data = profileSnap.data() as UserProfileData;
          setUserFullProfile(data);
        } else {
          setUserFullProfile(null);
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
  }, [currentUser?.uid, toast]);

  const form = useForm<YouTubeSummarizerFormData>({
    resolver: zodResolver(youtubeSummarizerFormSchema),
    defaultValues: {
      youtubeUrl: '',
      videoTranscript: '',
      customTitle: '',
    },
  });

  const handleFetchTranscript = async () => {
    const videoUrl = form.getValues('youtubeUrl');
    if (!videoUrl) {
      toast({ title: "Missing URL", description: "Please enter a YouTube video URL first.", variant: "destructive" });
      return;
    }

    setIsFetchingTranscript(true);
    setAnalysisResult(null); 
    setFetchTranscriptError(null); 

    try {
      const response = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        let serverErrorMsg = `Failed to fetch transcript. Server responded with status: ${response.status}`;
        try {
          const errorResult = await response.json();
          if (errorResult.error) {
            serverErrorMsg = errorResult.error;
          }
        } catch (e) {
          const textError = await response.text();
          console.warn("Non-JSON error response from /api/youtube-transcript:", textError.substring(0,500));
        }
        setFetchTranscriptError(serverErrorMsg);
        toast({ title: 'Transcript Fetch Failed', description: serverErrorMsg, variant: 'destructive' });
        setIsFetchingTranscript(false);
        return;
      }

      const result = await response.json();
      form.setValue('videoTranscript', result.transcript, { shouldValidate: true });
      toast({ title: "Transcript Fetched!", description: "Transcript has been loaded into the textarea." });
      setFetchTranscriptError(null); 

    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      const errorMessage = error.message || 'Could not fetch transcript. Please paste it manually.';
      setFetchTranscriptError(errorMessage); 
      toast({
        title: 'Transcript Fetch Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsFetchingTranscript(false);
    }
  };


  const onSubmit: SubmitHandler<YouTubeSummarizerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setFetchTranscriptError(null); 
    setMcqAnswers({});

    const aiInput: ProcessYouTubeVideoInput = {
      youtubeUrl: data.youtubeUrl || undefined,
      videoTranscript: data.videoTranscript,
      customTitle: data.customTitle || undefined,
      userName: userFullProfile?.fullName || currentUser?.displayName || undefined,
      examContext: userFullProfile?.targetExams && userFullProfile.targetExams.length > 0
                   ? (userFullProfile.targetExams[0] === 'other' && userFullProfile.otherExamName ? userFullProfile.otherExamName : userFullProfile.targetExams[0])
                   : undefined,
      language: 'English', 
    };

    try {
      const result: ProcessYouTubeVideoOutput = await processYouTubeVideo(aiInput);
      setAnalysisResult(result);
      const initialMcqAnswers: Record<number, MCQWithUserAnswer> = {};
      result.multipleChoiceQuestions.forEach((mcq, index) => {
        initialMcqAnswers[index] = { ...mcq, userSelectedOption: undefined, answerRevealed: false };
      });
      setMcqAnswers(initialMcqAnswers);
      setIsInputFormCollapsed(true); // Collapse form on success

      toast({
        title: '🎬 Video Processed! ✨',
        description: 'The AI has generated notes, summary, and a quiz from the transcript.',
      });
      if (currentUser?.uid) {
         await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error: any) {
      console.error('Error processing video transcript:', error);
      setAnalysisResult(null);
      setIsInputFormCollapsed(false); // Keep form open on error
      toast({
        title: 'Error Processing Video 😥',
        description: error.message || 'An unexpected error occurred with the AI.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMcqOptionChange = (questionIndex: number, optionIndex: string) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        userSelectedOption: parseInt(optionIndex),
      }
    }));
  };

  const handleShowAnswer = async (questionIndex: number) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        answerRevealed: true,
      }
    }));
    if (currentUser?.uid) {
      await recordPlatformInteraction(currentUser.uid);
    }
  };

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if ((name === 'youtubeUrl' || name === 'videoTranscript') && fetchTranscriptError) {
        setFetchTranscriptError(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, fetchTranscriptError]);

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading YouTube Summarizer...</p>
      </div>
    );
  }

  if (!userFullProfile?.hasCompletedOnboarding) {
    return <OnboardingGate featureName="YouTube Summarizer" hasPaid={true} />;
  }

  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem' },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem' }
  };


  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Youtube className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> YouTube Video Summarizer
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground leading-relaxed">
          Paste a YouTube URL to fetch its transcript, or paste transcript directly, then generate notes, summary, key points, and a quiz.
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
              setAnalysisResult(null);
              setMcqAnswers({});
              setFetchTranscriptError(null);
              form.reset();
            }}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-sm sm:text-base py-2.5 px-5 shadow-md hover:bg-accent/50"
          >
            <Edit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Summarize Another Video
          </Button>
        </motion.div>
      )}

      <motion.div
        animate={isInputFormCollapsed ? "collapsed" : "expanded"}
        variants={inputFormVariants}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ overflow: 'hidden', transformOrigin: 'top' }}
        className={isInputFormCollapsed ? "mt-0" : ""}
      >
        <Card className="shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Video Details & Transcript 📝</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                    Provide the video URL to attempt fetching its transcript, or paste the full transcript below.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">YouTube Video URL</FormLabel>
                      <div className="flex items-center gap-2">
                          <FormControl>
                          <Input placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" {...field} className="text-sm sm:text-base flex-grow" />
                          </FormControl>
                          <Button 
                              type="button" 
                              onClick={handleFetchTranscript} 
                              disabled={isFetchingTranscript || !field.value}
                              variant="outline"
                              className="shrink-0 text-xs sm:text-sm py-2 px-3"
                          >
                              {isFetchingTranscript ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : <Download className="mr-1.5 h-4 w-4"/>}
                              Fetch Transcript
                          </Button>
                      </div>
                      <FormDescription className="text-xs sm:text-sm">
                        Attempt to fetch transcript (if available and public). Otherwise, paste manually below.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {fetchTranscriptError && (
                  <Alert variant="warning" className="mt-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-semibold">
                      {fetchTranscriptError.includes("No transcript found") ? "Transcript Not Available via Fetch" : "Transcript Fetch Failed"}
                    </AlertTitle>
                    <AlertDescription>
                      <p>{fetchTranscriptError}</p>
                      <p className="mt-1">
                        If you have the transcript, you can <strong className="text-foreground">paste it manually</strong> into the textarea below to proceed.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <FormField
                  control={form.control}
                  name="customTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Custom Video Title (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Deep Dive into Quantum Entanglement" {...field} className="text-sm sm:text-base" />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        If you want to specify a title for the AI to use or refine.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoTranscript"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Video Transcript <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Paste the full video transcript here... (min 100 characters)"
                          className="min-h-[200px] sm:min-h-[250px] resize-y text-sm sm:text-base leading-relaxed"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        Ensure the transcript is clean and accurate for best results. Max 30,000 characters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="p-4 sm:p-6">
                <Button type="submit" disabled={isLoading || isFetchingTranscript} size="default" className="w-full sm:w-auto text-sm sm:text-base py-2.5 px-5">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Generating Study Material...
                    </>
                  ) : (
                    <>
                      <BookText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Generate from Transcript
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </motion.div>

      <div ref={resultsRef}>
        {(isLoading && form.formState.isSubmitted) && (
            <Suspense fallback={null}>
                <YouTubeSummarizerResultsDisplayFallback />
            </Suspense>
        )}
        {analysisResult && !isLoading && (
          <Suspense fallback={<YouTubeSummarizerResultsDisplayFallback />}>
            <YouTubeSummarizerResultsDisplay
              analysisResult={analysisResult}
              mcqAnswers={mcqAnswers}
              handleMcqOptionChange={handleMcqOptionChange}
              handleShowAnswer={handleShowAnswer}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

