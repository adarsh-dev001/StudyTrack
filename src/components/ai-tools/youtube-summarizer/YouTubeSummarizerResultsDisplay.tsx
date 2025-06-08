
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList, FileText, Tv, Download, Loader2 } from 'lucide-react';
import type { ProcessYouTubeVideoOutput } from '@/ai/flows/process-youtube-video-flow';
import type { MCQ } from '@/ai/flows/summarize-study-material'; // Re-using MCQ type
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

export default function YouTubeSummarizerResultsDisplay({
  analysisResult,
  mcqAnswers,
  handleMcqOptionChange,
  handleShowAnswer
}: YouTubeSummarizerResultsDisplayProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    const notesElement = document.getElementById('youtube-notes-content-for-pdf');
    if (!notesElement) {
      console.error("Notes content element not found for PDF generation.");
      alert("Could not generate PDF: Content missing.");
      return;
    }
    setIsDownloadingPdf(true);
    try {
      const canvas = await html2canvas(notesElement, {
        scale: 2, // Increase scale for better resolution
        useCORS: true,
        backgroundColor: window.getComputedStyle(document.documentElement).getPropertyValue('--card').trim() || '#ffffff', // Use themed background
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;

      let newImgWidth = pdfWidth - 20; // Margin of 10mm on each side
      let newImgHeight = newImgWidth / aspectRatio;

      // If image height is still too large for one page, consider splitting or making a scrollable single page
      // For now, we'll fit to width and let height be what it is.
      // If newImgHeight > pdfHeight - 20, it will exceed one page naturally.
      // Users can scroll a very long PDF page. True pagination is more complex.

      pdf.addImage(imgData, 'PNG', 10, 10, newImgWidth, newImgHeight);
      pdf.save(`${analysisResult.videoTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'youtube_notes'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const renderMarkdown = (markdownText: string) => {
    let html = markdownText;
    // Headers (ensure more specific regex and proper class application)
    html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold mt-3 mb-1">$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-md font-semibold mt-4 mb-1.5">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-5 mb-2 border-b pb-1">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold mt-6 mb-3 border-b pb-1.5">$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    // Unordered lists
    html = html.replace(/^\s*[-*+] (.*)/gm, (match, content) => `<li class="ml-4 leading-relaxed">${content}</li>`);
    html = html.replace(/(<ul>.*?<\/ul>|<(li).*?<\/\2>)/gs, (match, p1, p2) => {
      if (p2 === "li") return match; // avoid double wrapping li
      return `<ul class="list-disc list-outside pl-5 my-2 space-y-1">${match.replace(/<\/li><br \/><li>/g, '</li><li>').replace(/<ul><br \/>/g, '<ul>')}</ul>`;
    });
    // Ensure newlines become <br> but not excessively within list items handled by regex
    html = html.split('\n').map(line => line.trim() === '' ? '<br />' : line).join('<br />').replace(/<br \/>\s*<br \/>/g, '<br />');
    // Refine list item line breaks
    html = html.replace(/<\/li><br \/>(?=<li)/g, '</li>'); // Remove br between li
    html = html.replace(/<br \/>(<h[1-4]>)/g, '$1'); // Remove br before headings
    html = html.replace(/(<\/h[1-4]>)<br \/>/g, '$1'); // Remove br after headings

    return { __html: html };
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm h-auto rounded-lg shadow-md">
          <TabsTrigger value="notes" className="py-2.5 sm:py-3 flex items-center gap-1.5"><FileText className="h-4 w-4" />Notes</TabsTrigger>
          <TabsTrigger value="summary" className="py-2.5 sm:py-3 flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-2.5 sm:py-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 sm:py-3 flex items-center gap-1.5"><HelpCircle className="h-4 w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notes">
          <Card className="shadow-lg border-border">
            <CardHeader className="p-4 md:p-6 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center">
                  <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" /> Structured Notes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">Detailed breakdown from the video transcript.</CardDescription>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isDownloadingPdf} className="text-xs">
                {isDownloadingPdf ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                PDF
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div id="youtube-notes-content-for-pdf" className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100">
                <div dangerouslySetInnerHTML={renderMarkdown(analysisResult.structuredNotes)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="shadow-lg border-border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center">
                <ClipboardList className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" /> Video Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts">
          <Card className="shadow-lg border-border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center">
                <Sparkles className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" /> Key Concepts & Terms
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">Important takeaways from the video.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <ul className="space-y-2.5 text-base text-foreground/90 leading-relaxed dark:text-gray-100/90">
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

        <TabsContent value="quiz">
          <Card className="shadow-lg border-border">
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center">
                <HelpCircle className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" /> Quick Quiz: Test Your Knowledge! 🧩
              </CardTitle>
              <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">See how well you've grasped the video content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 md:p-6">
              {analysisResult.multipleChoiceQuestions.map((mcqItem, questionIndex) => {
                const mcqState = mcqAnswers[questionIndex] || { answerRevealed: false };
                const isCorrect = mcqState.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <div key={`mcq-${questionIndex}`} className="p-3 sm:p-4 border rounded-lg bg-card/60 dark:bg-card/30 shadow">
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
                        <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`vid-q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "h-4 w-4 sm:h-4 sm:w-4",
                              mcqState.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-600 dark:text-green-400",
                              mcqState.answerRevealed && optionIndex === mcqState.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-600 dark:text-red-400"
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
                        className="mt-3 sm:mt-4 text-xs py-1.5 px-2.5"
                        disabled={mcqState.userSelectedOption === undefined}
                      >
                        Show Answer
                      </Button>
                    )}
                    {mcqState.answerRevealed && (
                      <div className={cn(
                          "mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-md text-sm leading-relaxed border",
                          isCorrect ? "bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200" 
                                    : "bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200"
                        )}
                      >
                        <div className="flex items-center font-semibold mb-1 text-sm">
                          {isCorrect ? <CheckCircle className="mr-1.5 h-4 w-4" /> : <XCircle className="mr-1.5 h-4 w-4" />}
                          {isCorrect ? "Correct! 🎉" : `Incorrect. Correct answer: ${mcqItem.options[mcqItem.correctAnswerIndex]}`}
                        </div>
                        {mcqItem.explanation && (
                          <div className="mt-1.5 flex items-start text-xs">
                             <Lightbulb className="mr-1.5 h-3.5 w-3.5 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                             <p className="opacity-90">{mcqItem.explanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
    