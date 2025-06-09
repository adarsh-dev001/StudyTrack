
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
import { Loader2, Wand2, Sparkles, UploadCloud, FileText } from 'lucide-react'; // Added FileText
import { summarizeStudyMaterial, type SummarizeStudyMaterialOutput, type MCQ } from '@/ai/flows/summarize-study-material';
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

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}


// Lazy load result display
const SummarizerResultsDisplay = React.lazy(() => import('@/components/ai-tools/material-summarizer/SummarizerResultsDisplay'));
const SummarizerResultsDisplayFallback = React.lazy(() => import('@/components/ai-tools/material-summarizer/SummarizerResultsDisplayFallback'));


const summarizerFormSchema = z.object({
  material: z.string().min(50, { message: 'Study material must be at least 50 characters long.' }).max(30000, { message: 'Study material cannot exceed 30,000 characters due to processing limits.' }),
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }).max(100, { message: 'Topic cannot exceed 100 characters.' }),
  pdfFile: z.any().optional(),
});

type SummarizerFormData = z.infer<typeof summarizerFormSchema>;

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

export default function MaterialSummarizerPage() {
  const { currentUser } = useAuth();
  const [analysisResult, setAnalysisResult] = useState<SummarizeStudyMaterialOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
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
  };

  const form = useForm<SummarizerFormData>({
    resolver: zodResolver(summarizerFormSchema),
    defaultValues: {
      material: '',
      topic: '',
    },
  });

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid File Type', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for client-side processing
        toast({ title: 'File Too Large', description: 'Please upload a PDF smaller than 10MB for now.', variant: 'destructive' });
        return;
    }


    setIsProcessingPdf(true);
    toast({ title: 'Processing PDF...', description: 'Please wait while we extract the text.' });

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          const typedArray = new Uint8Array(e.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let textContent = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += text.items.map((s: any) => s.str).join(' ') + '\n';
          }
          form.setValue('material', textContent.trim());
          if (!form.getValues('topic')) {
            form.setValue('topic', file.name.replace(/\.pdf$/i, ''));
          }
          toast({ title: 'PDF Processed!', description: 'Text extracted and ready for summarization.' });
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({ title: 'Error Reading File', description: 'Could not read the PDF file.', variant: 'destructive' });
      }
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ title: 'Error Processing PDF', description: 'Could not extract text from the PDF.', variant: 'destructive' });
    } finally {
      setIsProcessingPdf(false);
      event.target.value = '';
    }
  };


  const onSubmit: SubmitHandler<SummarizerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setMcqAnswers({});

    if (!data.material) {
        toast({ title: "Missing Material", description: "Please enter text or upload a PDF to summarize.", variant: "destructive"});
        setIsLoading(false);
        return;
    }

    let examTypeForAI: string | undefined;
    let userLevelForAI: string | undefined;
    let userNameForAI: string | undefined;

    if (userFullProfile) {
        examTypeForAI = userFullProfile.targetExams && userFullProfile.targetExams.length > 0 
                            ? (userFullProfile.targetExams[0] === 'other' && userFullProfile.otherExamName ? userFullProfile.otherExamName : userFullProfile.targetExams[0]) 
                            : undefined;
        userLevelForAI = userFullProfile.subjectDetails && userFullProfile.subjectDetails.length > 0 
                            ? userFullProfile.subjectDetails[0].preparationLevel 
                            : undefined; 
        userNameForAI = userFullProfile.fullName || currentUser?.displayName || undefined;
    }


    try {
      const result: SummarizeStudyMaterialOutput = await summarizeStudyMaterial({
        material: data.material,
        topic: data.topic,
        examType: examTypeForAI,
        userLevel: userLevelForAI,
        userName: userNameForAI,
      });
      setAnalysisResult(result);
      const initialMcqAnswers: Record<number, MCQWithUserAnswer> = {};
      result.multipleChoiceQuestions.forEach((mcq, index) => {
        initialMcqAnswers[index] = { ...mcq, userSelectedOption: undefined, answerRevealed: false };
      });
      setMcqAnswers(initialMcqAnswers);

      toast({
        title: 'Material Processed! ✨',
        description: 'The AI has generated summary, key concepts, and a quiz.',
      });
      if (currentUser?.uid) {
        await recordPlatformInteraction(currentUser.uid);
      }
    } catch (error: any) {
      console.error('Error processing material:', error);
      setAnalysisResult(null);
      toast({
        title: 'Error Processing Material 😥',
        description: error.message || 'An unexpected error occurred.',
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

  if (isLoadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Summarizer...</p>
      </div>
    );
  }

  if (showOnboardingModal && currentUser) {
    return (
      <Dialog open={showOnboardingModal} onOpenChange={(isOpen) => {
          if (!currentUser) return;
          if (!isOpen && userFullProfile && !userFullProfile.onboardingCompleted) {
             setShowOnboardingModal(true); return;
          }
          setShowOnboardingModal(isOpen);
        }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] p-0">
          <DialogHeader className="p-4 sm:p-6 border-b text-center shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Please provide your details to personalize your StudyTrack experience and unlock AI features.
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


  return (
    <div className="w-full space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <FileText className="mr-2 sm:mr-3 h-7 w-7 sm:h-8 sm:w-8 text-primary" /> AI Material Processor
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          Upload a PDF or paste study material to get structured notes, summary, key concepts, and a quick quiz. 📚
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Input Material 📝</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Upload a PDF or paste text for analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              <FormField
                control={form.control}
                name="pdfFile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Upload PDF (Max 10MB)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="file"
                          id="pdfFile"
                          accept=".pdf"
                          onChange={handlePdfFileChange}
                          className="text-sm sm:text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          disabled={isProcessingPdf}
                        />
                        {isProcessingPdf && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      The text from the PDF will fill the text area below.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Topic <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Photosynthesis, Indian National Movement" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormDescription className="text-xs sm:text-sm">
                      What is the main topic of the material?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="material"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Study Material (Text) <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your study notes, textbook chapter, or article here... (or upload a PDF above)"
                        className="min-h-[150px] sm:min-h-[200px] resize-y text-sm sm:text-base"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription className="text-xs sm:text-sm">
                      Enter the content you want to process (min 50 characters, max 30,000).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="p-4 sm:p-6">
              <Button type="submit" disabled={isLoading || isProcessingPdf} size="default" className="w-full sm:w-auto text-sm sm:text-base">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Generate Insights
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
                <SummarizerResultsDisplayFallback />
            </Suspense>
        )}
        {analysisResult && !isLoading && (
          <Suspense fallback={<SummarizerResultsDisplayFallback />}>
            <SummarizerResultsDisplay
              analysisResult={analysisResult}
              mcqAnswers={mcqAnswers}
              topic={form.getValues('topic')}
              handleMcqOptionChange={handleMcqOptionChange}
              handleShowAnswer={handleShowAnswer}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
