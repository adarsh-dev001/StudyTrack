
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
import { Loader2, Wand2, Sparkles, UploadCloud, FileText, Download, BookText, AlertTriangle, Edit, CheckCircle } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion'; 
import * as pdfjsLib from 'pdfjs-dist';

const SummarizerResultsDisplay = React.lazy(() => import('@/components/ai-tools/material-summarizer/SummarizerResultsDisplay'));
const SummarizerResultsDisplayFallback = React.lazy(() => import('@/components/ai-tools/material-summarizer/SummarizerResultsDisplayFallback'));

const MAX_TEXT_LENGTH = 30000;

const summarizerFormSchema = z.object({
  material: z.string()
    .min(50, { message: 'Study material must be at least 50 characters long.' })
    .max(MAX_TEXT_LENGTH, { message: `Study material cannot exceed ${MAX_TEXT_LENGTH} characters.` }),
  topic: z.string()
    .min(3, { message: 'Topic must be at least 3 characters long.' })
    .max(100, { message: 'Topic cannot exceed 100 characters.' }),
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userFullProfile, setUserFullProfile] = useState<UserProfileData | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [isInputFormCollapsed, setIsInputFormCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
    }
  }, []); 

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

  const materialValue = form.watch('material');
  const characterCount = materialValue?.length || 0;

  const handlePdfFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPdfFileName(null);
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid File Type', description: 'Please upload a PDF file.', variant: 'destructive' });
      setPdfFileName(null);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'File Too Large', description: 'Please upload a PDF smaller than 10MB for now.', variant: 'destructive' });
        setPdfFileName(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
    }

    setPdfFileName(file.name);
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
            textContent += text.items.map((s: any) => s.str).join(' ') + '\n'; // Use \n for newlines
          }
          const extractedText = textContent.trim();
          if (extractedText.length > MAX_TEXT_LENGTH) {
            form.setValue('material', extractedText.substring(0, MAX_TEXT_LENGTH));
            toast({ title: 'PDF Processed (Truncated)', description: `Text extracted. Max ${MAX_TEXT_LENGTH} chars loaded.`, variant: "default" });
          } else {
            form.setValue('material', extractedText);
            toast({ title: 'PDF Processed!', description: 'Text extracted and ready for summarization.' });
          }
          if (!form.getValues('topic')) {
            form.setValue('topic', file.name.replace(/\\.pdf$/i, ''));
          }
        }
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        toast({ title: 'Error Reading File', description: 'Could not read the PDF file.', variant: 'destructive' });
        setPdfFileName(null);
      }
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({ title: 'Error Processing PDF', description: 'Could not extract text from the PDF.', variant: 'destructive' });
      setPdfFileName(null);
    } finally {
      setIsProcessingPdf(false);
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
      setIsInputFormCollapsed(true);

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
      setIsInputFormCollapsed(false);
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
        <p className="text-muted-foreground">Loading Material Processor...</p>
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

  const inputFormVariants = {
    expanded: { opacity: 1, height: 'auto', scaleY: 1, marginTop: '0rem', marginBottom: '0rem' },
    collapsed: { opacity: 0, height: 0, scaleY: 0.95, marginTop: '0rem', marginBottom: '0rem' }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      <header className="text-center space-y-2">
        <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-primary" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight md:text-5xl text-foreground">
          AI Material Processor
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transform your study materials effortlessly. Upload a PDF or paste text to generate structured notes, concise summaries, key concepts, and a quick quiz to test your understanding.
        </p>
      </header>

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
              setPdfFileName(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              form.reset(); 
            }}
            variant="default" // Changed variant to default for primary color
            size="lg"
            className="w-full sm:w-auto text-base py-3 px-6 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            <Edit className="mr-2 h-5 w-5" /> Process New Material
          </Button>
        </motion.div>
      )}

      <AnimatePresence>
      {!isInputFormCollapsed && (
        <motion.div
          key="input-form"
          initial={{ opacity: 0, height: 0, scaleY: 0.9 }}
          animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
          exit={{ opacity: 0, height: 0, scaleY: 0.9 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ overflow: 'hidden', transformOrigin: 'top' }}
          className="mt-0"
        >
          <Card className="shadow-xl border-border/70 bg-card rounded-xl">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="p-5 sm:p-8">
                  <CardTitle className="text-xl sm:text-2xl font-semibold text-primary">Input Your Material 📝</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-muted-foreground">Upload a PDF (max 10MB) or paste text directly below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-5 sm:p-8">
                  
                  <div className="space-y-3">
                    <FormLabel className="text-base sm:text-lg font-medium text-foreground">Upload PDF</FormLabel>
                    <div 
                      className="relative flex flex-col items-center justify-center w-full p-6 sm:p-8 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary transition-colors duration-200 bg-muted/20 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          if (fileInputRef.current) fileInputRef.current.files = e.dataTransfer.files;
                          handlePdfFileChange({ target: { files: e.dataTransfer.files } } as any);
                        }
                      }}
                    >
                      <UploadCloud className="h-10 w-10 sm:h-12 sm:w-12 text-primary mb-3" />
                      <p className="text-sm sm:text-base text-foreground font-medium">Drag & Drop PDF here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        id="pdfFile"
                        accept=".pdf"
                        onChange={handlePdfFileChange}
                        className="opacity-0 w-0 h-0 absolute"
                        disabled={isProcessingPdf}
                      />
                    </div>
                    {pdfFileName && (
                      <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-4 w-4 mr-2"/> Selected: {pdfFileName}
                      </div>
                    )}
                     <FormField control={form.control} name="pdfFile" render={({ field }) => <FormMessage />} />
                  </div>

                  <div className="flex items-center space-x-3 my-4">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="text-sm text-muted-foreground font-medium">OR</span>
                    <div className="flex-grow border-t border-border"></div>
                  </div>

                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base sm:text-lg font-medium text-foreground">Topic <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Photosynthesis, Indian National Movement" {...field} className="text-sm sm:text-base h-11 sm:h-12 rounded-lg border-muted-foreground/30 focus:border-primary focus:ring-primary" />
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
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
                        <FormLabel className="text-base sm:text-lg font-medium text-foreground">Study Material (Text) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your study notes, textbook chapter, or article here..."
                            className="min-h-[180px] sm:min-h-[220px] resize-y text-sm sm:text-base rounded-lg border-muted-foreground/30 focus:border-primary focus:ring-primary p-3 sm:p-4"
                            {...field}
                          />
                        </FormControl>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                            <span>Enter the content you want to process.</span>
                            <span className={characterCount > MAX_TEXT_LENGTH ? 'text-destructive font-medium' : ''}>
                                {characterCount}/{MAX_TEXT_LENGTH}
                            </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="p-5 sm:p-8">
                  <Button 
                    type="submit" 
                    disabled={isLoading || isProcessingPdf} 
                    size="lg" 
                    className="w-full sm:w-auto text-base py-3 px-8 bg-gradient-to-r from-primary to-teal-500 hover:from-primary/90 hover:to-teal-500/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105"
                  >
                    {isLoading || isProcessingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {isProcessingPdf ? 'Processing PDF...' : 'Generating Insights...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Process Material
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </motion.div>
      )}
      </AnimatePresence>
      
      <div ref={resultsRef}>
        {(isLoading && form.formState.isSubmitted && !isProcessingPdf) && (
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
    
    
