
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList, FileText, Download, Loader2 } from 'lucide-react';
import type { SummarizeStudyMaterialOutput, MCQ } from '@/ai/flows/summarize-study-material';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

interface SummarizerResultsDisplayProps {
  analysisResult: SummarizeStudyMaterialOutput;
  mcqAnswers: Record<number, MCQWithUserAnswer>;
  topic: string;
  handleMcqOptionChange: (questionIndex: number, optionIndex: string) => void;
  handleShowAnswer: (questionIndex: number) => Promise<void>;
}

// Basic Markdown to HTML renderer
function renderBasicMarkdown(markdownText: string): string {
  let html = markdownText;
  // Headers (more specific regex and classes)
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-md font-semibold mt-3 mb-1">$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-1.5">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-2 border-b pb-1">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3 border-b pb-1.5">$1</h1>');
  
  // Bold and Italic (ensure not to mess up URLs or other constructs)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Unordered lists (basic, improved for nesting somewhat)
  // Handle nested lists better by processing outer lists first
  html = html.replace(/^\s*([-*+]) +(.*)/gm, (match, bullet, content) => {
    // Simple check for nesting depth for basic styling
    const depth = (match.match(/^\s*/)?.[0].length || 0) / 2; // Assuming 2 spaces per indent level
    const marginLeft = depth > 0 ? `ml-${depth * 4}` : 'ml-4';
    return `<li class="${marginLeft} leading-relaxed">${content.trim()}</li>`;
  });
  // Wrap sets of <li> into <ul>
  html = html.replace(/((<li.*?>.*?<\/li>\s*)+)/g, (match) => {
    // Avoid double-wrapping if already in a <ul>
    if (match.trim().startsWith('<ul') && match.trim().endsWith('</ul>')) return match;
    return `<ul class="list-disc list-outside pl-5 my-2 space-y-1">${match}</ul>`;
  });
  
  // Convert newlines to <br />, but be careful not to add too many
  html = html.split('\n').map(line => line.trim() === '' ? '<br class="my-1"/>' : line).join('<br />')
    .replace(/<br \/>\s*<br \/>/g, '<br class="my-1"/>') // Consolidate multiple breaks
    .replace(/(<\/ul>)<br class="my-1"\/>/g, '$1') // Remove <br> after </ul>
    .replace(/<br class="my-1"\/>(<ul)/g, '$1')   // Remove <br> before <ul>
    .replace(/(<\/h[1-4]>)<br class="my-1"\/>/g, '$1') // Remove <br> after headings
    .replace(/<br class="my-1"\/>(<h[1-4]>)/g, '$1');  // Remove <br> before headings
    
  return html;
}


export default function SummarizerResultsDisplay({
  analysisResult,
  mcqAnswers,
  topic,
  handleMcqOptionChange,
  handleShowAnswer
}: SummarizerResultsDisplayProps) {
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    const notesElement = document.getElementById('structured-notes-content-for-pdf');
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
      // const pdfHeight = pdf.internal.pageSize.getHeight(); // Not used for single page image
      const imgProps= pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let newImgWidth = pdfWidth - 20; // Margin of 10mm on each side
      let newImgHeight = newImgWidth / aspectRatio;

      pdf.addImage(imgData, 'PNG', 10, 10, newImgWidth, newImgHeight);
      pdf.save(`${topic.replace(/[^a-zA-Z0-9]/g, '_') || 'study_notes'}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="structuredNotes" className="w-full animate-in fade-in-50 duration-500">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm h-auto rounded-lg shadow-md">
          <TabsTrigger value="structuredNotes" className="py-2.5 sm:py-3 flex items-center gap-1.5"><FileText className="h-4 w-4" />Notes</TabsTrigger>
          <TabsTrigger value="summary" className="py-2.5 sm:py-3 flex items-center gap-1.5"><ClipboardList className="h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-2.5 sm:py-3 flex items-center gap-1.5"><Sparkles className="h-4 w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 sm:py-3 flex items-center gap-1.5"><HelpCircle className="h-4 w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="structuredNotes">
          <Card className="shadow-lg border-border">
            <CardHeader className="p-4 md:p-6 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg md:text-xl font-semibold text-foreground flex items-center">
                    <FileText className="mr-2 h-5 w-5 md:h-6 md:w-6 text-accent" /> AI-Generated Study Notes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">Topic: {topic}</CardDescription>
              </div>
              <Button onClick={handleDownloadPdf} variant="outline" size="sm" disabled={isDownloadingPdf} className="text-xs">
                {isDownloadingPdf ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin"/> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                PDF
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div id="structured-notes-content-for-pdf" className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100">
                <div dangerouslySetInnerHTML={renderBasicMarkdown(analysisResult.structuredNotes)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><ClipboardList className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Summary of Material</CardTitle>
              <CardDescription className="text-sm sm:text-base">Topic: {topic}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Core Concepts Unpacked</CardTitle>
              <CardDescription className="text-sm sm:text-base">Main ideas from your material.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-2.5 text-base text-foreground/90 leading-relaxed">
                {analysisResult.keyConcepts.map((concept, index) => (
                  <li key={`concept-${index}`} className="flex items-start p-2 rounded-md bg-muted/50">
                      <CheckCircle className="mr-2 sm:mr-3 h-4 w-4 text-green-500 dark:text-green-400 shrink-0 mt-1" />
                      <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold"><HelpCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Quick Quiz: Test Your Knowledge! 🧩</CardTitle>
              <CardDescription className="text-sm sm:text-base">See how well you've grasped the concepts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {Object.entries(mcqAnswers).map(([qIndexStr, mcqItem]) => {
                const questionIndex = parseInt(qIndexStr);
                const isCorrect = mcqItem.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <div key={`mcq-${questionIndex}`} className="p-3 sm:p-4 border rounded-lg bg-card/60 shadow">
                    <p className="font-semibold mb-2 sm:mb-3 text-base sm:text-md text-foreground leading-snug">
                      <span className="text-sm text-muted-foreground uppercase tracking-wide mr-1.5">Q{questionIndex + 1}:</span> {mcqItem.questionText}
                    </p>
                    <RadioGroup
                      value={mcqItem.userSelectedOption?.toString()}
                      onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                      disabled={mcqItem.answerRevealed}
                      className="space-y-1.5 sm:space-y-2"
                    >
                      {mcqItem.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                          <RadioGroupItem 
                            value={optionIndex.toString()} 
                            id={`q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "h-4 w-4 sm:h-4 sm:w-4",
                              mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-600",
                              mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-600"
                            )}
                          />
                          <Label 
                            htmlFor={`q${questionIndex}-opt${optionIndex}`}
                            className={cn(
                              "font-normal text-sm text-foreground/90 leading-relaxed cursor-pointer",
                              mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "text-green-700 dark:text-green-300 font-medium",
                              mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "text-red-700 dark:text-red-300"
                            )}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    {!mcqItem.answerRevealed && (
                      <Button 
                        onClick={() => handleShowAnswer(questionIndex)} 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 sm:mt-4 text-xs py-1.5 px-2.5"
                        disabled={mcqItem.userSelectedOption === undefined}
                      >
                        Show Answer
                      </Button>
                    )}
                    {mcqItem.answerRevealed && (
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
      <div className="mt-6 sm:mt-8 text-center p-3 sm:p-4 border-t bg-card rounded-b-lg">
        <p className="text-md sm:text-lg font-semibold text-accent leading-relaxed">✨ Understanding is power! Use these insights to supercharge your learning. You're doing great! 💪</p>
      </div>
    </div>
  );
}

