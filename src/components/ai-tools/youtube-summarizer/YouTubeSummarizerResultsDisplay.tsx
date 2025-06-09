
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList, FileText, Tv, Download, Loader2, Share2, SaveAll, FileOutput, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProcessYouTubeVideoOutput } from '@/ai/flows/process-youtube-video-flow';
import type { MCQ } from '@/ai/flows/summarize-study-material'; 
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { renderMarkdownToHtml } from '@/lib/markdown-utils';


interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

interface YouTubeSummarizerResultsDisplayProps {
  analysisResult: ProcessYouTubeVideoOutput;
  mcqAnswers: Record<number, MCQWithUserAnswer>;
  handleMcqOptionChange: (questionIndex: number, optionIndex: string) => void;
  handleShowAnswer: (questionIndex: number) => Promise<void>;
}

const MAX_NOTES_LENGTH_DISPLAY = 1000; // Characters to show before truncation
const INITIAL_COLLAPSED_MAX_HEIGHT = '300px'; // CSS max-height for collapsed view
const EXPANDED_MAX_HEIGHT = '5000px'; // Large pixel value for expanded state

export default function YouTubeSummarizerResultsDisplay({
  analysisResult,
  mcqAnswers,
  handleMcqOptionChange,
  handleShowAnswer
}: YouTubeSummarizerResultsDisplayProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const { toast } = useToast();

  const [isNotesExpanded, setIsNotesExpanded] = React.useState(false);
  const [showToggleNotesButton, setShowToggleNotesButton] = React.useState(false);

  useEffect(() => {
    if (analysisResult.structuredNotes.length > MAX_NOTES_LENGTH_DISPLAY) {
      setShowToggleNotesButton(true);
      setIsNotesExpanded(false); 
    } else {
      setShowToggleNotesButton(false);
      setIsNotesExpanded(true); 
    }
  }, [analysisResult.structuredNotes]);

  const handleShare = async () => {
    const shareData = {
      title: `YouTube Notes: ${analysisResult.videoTitle}`,
      text: `Check out these AI-generated study notes for "${analysisResult.videoTitle}" from StudyTrack!\nSummary: ${analysisResult.summary.substring(0,100)}...`,
      url: window.location.href, 
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        toast({ title: "Link Copied!", description: "Link to these notes copied to clipboard." });
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast({ title: "Sharing Error", description: "Could not share at this moment.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    const notesElement = document.getElementById('youtube-notes-content-for-pdf');
    if (notesElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Print Notes - ${analysisResult.videoTitle}</title>`);
            printWindow.document.write('<style> body { font-family: sans-serif; line-height: 1.6; } h1, h2, h3, h4 { margin-bottom: 0.5em; } ul, ol { padding-left: 20px; margin-top: 0.5em; margin-bottom: 0.5em; } p { margin-top: 0.5em; margin-bottom: 0.5em;} </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(notesElement.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
             toast({ title: "Print Error", description: "Could not open print window. Check pop-up blockers.", variant: "destructive" });
        }
    } else {
        toast({ title: "Print Error", description: "Notes content not found for printing.", variant: "destructive" });
    }
  };

  const handleDownloadPdf = async () => {
    const notesElement = document.getElementById('youtube-notes-content-for-pdf');
    if (!notesElement) {
      toast({ title: "PDF Error", description: "Notes content element not found for PDF generation.", variant: "destructive" });
      return;
    }
    setIsDownloadingPdf(true);
    toast({ title: "Generating PDF...", description: "Please wait, this may take a moment." });
    try {
      const cardBgValue = window.getComputedStyle(document.documentElement).getPropertyValue('--card').trim();
      const formattedCardBg = `hsl(${cardBgValue})`;

      const canvas = await html2canvas(notesElement, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: formattedCardBg || '#ffffff',
        logging: false, 
        windowWidth: notesElement.scrollWidth,
        windowHeight: notesElement.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps= pdf.getImageProperties(imgData);
      
      let imgWidth = pdfWidth - 20; 
      let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 10; 

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); 

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10; 
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }
      
      pdf.save(`${analysisResult.videoTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'youtube_notes'}.pdf`);
      toast({ title: "PDF Downloaded!", description: "Your notes have been saved as a PDF." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF Generation Failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border-primary/30 bg-card">
        <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-xl md:text-2xl font-bold text-primary flex items-center">
                <Tv className="mr-2 h-6 w-6 md:h-7 md:w-7" /> {analysisResult.videoTitle}
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground">
              AI-Generated Study Material from Video Transcript
            </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="notes" className="w-full animate-in fade-in-50 duration-500">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm h-auto rounded-xl shadow-md bg-muted/70 p-1">
          <TabsTrigger value="notes" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><FileText className="h-4 w-4" />Notes</TabsTrigger>
          <TabsTrigger value="summary" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><ClipboardList className="h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><Sparkles className="h-4 w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><HelpCircle className="h-4 w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notes" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 border-b gap-2">
              <div className="flex-grow">
                <CardTitle className="text-lg md:text-xl font-bold font-headline text-primary flex items-center">
                    <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> Structured Notes
                </CardTitle>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-0 self-start sm:self-center">
                  <Button onClick={handleDownloadPdf} variant="outline" size="icon" title="Download as PDF" disabled={isDownloadingPdf} className="h-8 w-8 sm:h-9 sm:w-9 text-primary border-primary hover:bg-primary/10">
                    {isDownloadingPdf ? <Loader2 className="h-4 w-4 animate-spin"/> : <Download className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleShare} variant="outline" size="icon" title="Share Notes" className="h-8 w-8 sm:h-9 sm:w-9 text-primary border-primary hover:bg-primary/10">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => toast({ title: "Coming Soon!", description: "Saving to 'My Notes' will be available shortly." })} variant="outline" size="icon" title="Save to My Notes (Coming Soon)" className="h-8 w-8 sm:h-9 sm:w-9 text-primary border-primary hover:bg-primary/10">
                    <SaveAll className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => toast({ title: "Coming Soon!", description: "Export options (MD, Word) are planned." })} variant="outline" size="icon" title="Export Notes (Coming Soon)" className="h-8 w-8 sm:h-9 sm:w-9 text-primary border-primary hover:bg-primary/10">
                    <FileOutput className="h-4 w-4" />
                  </Button>
                   <Button onClick={handlePrint} variant="outline" size="icon" title="Print Notes" className="h-8 w-8 sm:h-9 sm:w-9 text-primary border-primary hover:bg-primary/10">
                    <Printer className="h-4 w-4" />
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 bg-background min-h-[200px] relative">
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '800px' }}>
                <div 
                  id="youtube-notes-content-for-pdf" 
                  className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100 font-body bg-card p-4"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(analysisResult.structuredNotes) }}
                />
              </div>
              <motion.div
                animate={{ maxHeight: isNotesExpanded ? EXPANDED_MAX_HEIGHT : INITIAL_COLLAPSED_MAX_HEIGHT }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden relative"
              >
                <div 
                  className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100 font-body"
                  dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(analysisResult.structuredNotes) }}
                />
                {!isNotesExpanded && showToggleNotesButton && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
                )}
              </motion.div>
              
              {showToggleNotesButton && (
                <div className="flex justify-center mt-3">
                  <Button
                    onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                    variant="outline"
                    size="sm"
                    className="bg-card hover:bg-muted shadow-md"
                  >
                    {isNotesExpanded ? <ChevronUp className="mr-1.5 h-4 w-4" /> : <ChevronDown className="mr-1.5 h-4 w-4" />}
                    {isNotesExpanded ? "Show Less" : "Show More"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 md:p-6 bg-card/80 border-b">
              <CardTitle className="flex items-center text-lg md:text-xl font-semibold text-primary"><ClipboardList className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Video Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 bg-background min-h-[200px]">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed font-body">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 md:p-6 bg-card/80 border-b">
              <CardTitle className="flex items-center text-lg md:text-xl font-semibold text-primary"><Sparkles className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Key Concepts & Terms</CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">Important takeaways from the video.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6 bg-background min-h-[200px]">
              <ul className="space-y-2.5 text-base text-foreground/90 leading-relaxed font-body">
                {analysisResult.keyConcepts.map((concept, index) => (
                  <li key={`concept-${index}`} className="flex items-start p-2 rounded-md bg-muted/50 dark:bg-muted/20">
                      <CheckCircle className="mr-2 sm:mr-3 h-4 w-4 text-green-500 dark:text-green-400 shrink-0 mt-1" />
                      <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 md:p-6 bg-card/80 border-b">
              <CardTitle className="text-lg md:text-xl font-semibold text-primary flex items-center">
                <HelpCircle className="mr-2 h-5 w-5 md:h-6 md:w-6" /> Quick Quiz: Test Your Knowledge! 🧩
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">See how well you've grasped the video content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 md:p-6 bg-background">
              {analysisResult.multipleChoiceQuestions.map((mcqItem, questionIndex) => {
                const mcqState = mcqAnswers[questionIndex] || { answerRevealed: false };
                const isCorrect = mcqState.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <Card key={`mcq-${questionIndex}`} className="shadow-md border-border/50 rounded-lg overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                        <p className="font-semibold mb-2 sm:mb-3 text-base sm:text-md text-foreground dark:text-gray-100 leading-snug">
                        <span className="text-sm text-muted-foreground uppercase tracking-wide mr-1.5">Q{questionIndex + 1}:</span> {mcqItem.questionText}
                        </p>
                        <RadioGroup
                        value={mcqState.userSelectedOption?.toString()}
                        onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                        disabled={mcqState.answerRevealed}
                        className="space-y-1.5 sm:space-y-2"
                        >
                        {mcqItem.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <RadioGroupItem 
                                value={optionIndex.toString()} 
                                id={`vid-q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                "h-4 w-4 sm:h-4 sm:w-4 border-muted-foreground/70 focus:ring-primary text-primary data-[state=checked]:border-primary",
                                mcqState.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600",
                                mcqState.answerRevealed && optionIndex === mcqState.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600"
                                )}
                            />
                            <Label 
                                htmlFor={`vid-q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                "font-normal text-sm text-foreground/90 dark:text-gray-100/90 leading-relaxed cursor-pointer",
                                mcqState.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "text-green-700 dark:text-green-300 font-medium",
                                mcqState.answerRevealed && optionIndex === mcqState.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "text-red-700 dark:text-red-300"
                                )}
                            >
                                {option}
                            </Label>
                            </div>
                        ))}
                        </RadioGroup>
                        {!mcqState.answerRevealed && (
                        <Button 
                            onClick={() => handleShowAnswer(questionIndex)} 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 sm:mt-4 text-xs py-1.5 px-2.5 border-primary/70 text-primary hover:bg-primary/10"
                            disabled={mcqState.userSelectedOption === undefined}
                        >
                            Show Answer
                        </Button>
                        )}
                        {mcqState.answerRevealed && (
                        <div className={cn(
                            "mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg text-sm leading-relaxed border-2",
                            isCorrect ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300" 
                                        : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                            )}
                        >
                            <div className="flex items-center font-semibold mb-1 text-sm">
                            {isCorrect ? <CheckCircle className="mr-1.5 h-4 w-4" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                            {isCorrect ? "Correct! 🎉" : `Incorrect. Correct answer: ${mcqItem.options[mcqItem.correctAnswerIndex]}`}
                            </div>
                            {mcqItem.explanation && (
                            <div className="mt-1.5 flex items-start text-xs">
                                <Lightbulb className="mr-1.5 h-3.5 w-3.5 mt-0.5 text-yellow-500 dark:text-yellow-400 shrink-0" />
                                <p className="opacity-90">{mcqItem.explanation}</p>
                            </div>
                            )}
                        </div>
                        )}
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Card className="mt-6 sm:mt-8 border-t-0 rounded-t-none bg-accent/10 border-accent/30 shadow-lg">
        <CardContent className="p-4 md:p-6 text-center">
            <p className="text-md md:text-lg font-semibold text-accent-foreground/90 dark:text-accent-foreground/80 leading-relaxed">
                ✨ Hope this helps your studies! Transform any video into learning material. Keep learning! 🚀
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

