
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
import { Loader2, Wand2, Sparkles, Youtube, FileText, Download, BookText } from 'lucide-react';
import {
  processYouTubeVideo,
  type ProcessYouTubeVideoInput,
  type ProcessYouTubeVideoOutput,
} from '@/ai/flows/process-youtube-video-flow';
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

const YouTubeSummarizerResultsDisplay = React.lazy(() => import('@/components/ai-tools/youtube-summarizer/YouTubeSummarizerResultsDisplay'));
const YouTubeSummarizerResultsDisplayFallback = React.lazy(() => import('@/components/ai-tools/youtube-summarizer/YouTubeSummarizerResultsDisplayFallback'));

const youtubeSummarizerFormSchema = z.object({
  youtubeUrl: z.string().url({ message: "Please enter a valid YouTube URL." }).optional().describe('The URL of the YouTube video.'),
  videoTranscript: z
    .string()
    .min(100, { message: "Transcript must be at least 100 characters." })
    .max(30000, { message: "Transcript is too long (max 30,000 characters)." })
    .describe('The transcript of the YouTube video.'),
  customTitle: z.string().optional().describe('Optional: A custom title for the video if you want to override or provide one.'),
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
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, MCQWithUserAnswer>>({});
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userFullProfile, setUserFullProfile] = useState<UserProfileData | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

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
          if (!data.onboardingCompleted) {
            setShowOnboardingModal(true);
          } else {
            setShowOnboardingModal(false);
          }
        } else {
          setUserFullProfile(null);
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
  }, [currentUser?.uid, toast]);

  const handleOnboardingSuccess = () => {
    setShowOnboardingModal(false);
    if (currentUser?.uid) {
      const profileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      getDoc(profileDocRef).then(profileSnap => {
        if (profileSnap.exists()) {
          setUserFullProfile(profileSnap.data() as UserProfileData);
        }
      });
    }
  };

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

    try {
      const response = await fetch('/api/youtube-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        let serverError = `Failed to fetch transcript. Server responded with status: ${response.status}`;
        try {
          const errorResult = await response.json();
          if (errorResult.error) {
            serverError = errorResult.error;
          }
        } catch (e) {
          // Error response wasn't JSON, likely HTML. Log it for debugging.
          const textError = await response.text();
          console.error("Non-JSON error response from /api/youtube-transcript:", textError.substring(0, 500)); // Log first 500 chars
          serverError = "Failed to fetch transcript. Server returned an unexpected response.";
        }
        throw new Error(serverError);
      }

      const result = await response.json();
      form.setValue('videoTranscript', result.transcript, { shouldValidate: true });
      toast({ title: "Transcript Fetched!", description: "Transcript has been loaded into the textarea." });

    } catch (error: any) {
      console.error('Error fetching transcript:', error);
      toast({
        title: 'Transcript Fetch Error',
        description: error.message || 'Could not fetch transcript. Please paste it manually.',
        variant: 'destructive',
      });
    } finally {
      setIsFetchingTranscript(false);
    }
  };


  const onSubmit: SubmitHandler<YouTubeSummarizerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setMcqAnswers({});

    const aiInput: ProcessYouTubeVideoInput = {
      ...data,
      youtubeUrl: data.youtubeUrl || undefined,
      customTitle: data.customTitle || undefined,
      userName: userFullProfile?.fullName || currentUser?.displayName || undefined,
      examContext: userFullProfile?.targetExams && userFullProfile.targetExams.length > 0
                   ? (userFullProfile.targetExams[0] === 'other' && userFullProfile.otherExamName ? userFullProfile.otherExamName : userFullProfile.targetExams[0])
                   : undefined,
      language: 'English', // Assuming English for now, could be a form field
    };

    try {
      const result: ProcessYouTubeVideoOutput = await processYouTubeVideo(aiInput);
      setAnalysisResult(result);
      const initialMcqAnswers: Record<number, MCQWithUserAnswer> = {};
      result.multipleChoiceQuestions.forEach((mcq, index) => {
        initialMcqAnswers[index] = { ...mcq, userSelectedOption: undefined, answerRevealed: false };
      });
      setMcqAnswers(initialMcqAnswers);

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

  if (isLoadingProfile && currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Video Summarizer...</p>
      </div>
    );
  }

  if (currentUser && !userFullProfile?.onboardingCompleted && !isLoadingProfile) {
    return (
      <Dialog open={true} onOpenChange={(isOpen) => {
          if (!isOpen) {
             toast({ title: "Profile Setup Required", description: "Please complete your profile to use AI tools.", variant: "default"});
          }
        }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6 border-b text-center shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Unlock full AI capabilities by telling us a bit about your study goals.
            </DialogDescription>
          </DialogHeader>
           <ScrollArea className="h-[calc(90vh-8rem)] p-4 sm:p-6">
             <Suspense fallback={<OnboardingFormFallback />}>
                <OnboardingForm userId={currentUser.uid} onComplete={handleOnboardingSuccess} />
             </Suspense>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  if (currentUser && userFullProfile && !userFullProfile.onboardingCompleted) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
            <p className="text-lg text-muted-foreground">Please complete your profile through the modal to use AI tools.</p>
        </div>
    );
  }


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
    
