
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList, FileText, Download, Loader2, Brain, Share2, SaveAll, FileOutput, Printer } from 'lucide-react';
import type { SummarizeStudyMaterialOutput, MCQ } from '@/ai/flows/summarize-study-material';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

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

function renderBasicMarkdown(markdownText: string): string {
  let html = markdownText;
  // Headers - ensure proper class names and newlines
  html = html.replace(/^# (.*$)/gim, '<h1 class="font-headline text-2xl font-bold mt-6 mb-3 border-b border-border/70 pb-1.5">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="font-headline text-xl font-semibold mt-5 mb-2 border-b border-border/70 pb-1">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="font-headline text-lg font-semibold mt-4 mb-1.5">$1</h3>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="font-headline text-base font-semibold mt-3 mb-1">$1</h4>');
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');

  // Unordered lists - simplified approach for cleaner output within dangerouslySetInnerHTML
  // Wrap list blocks properly and handle nested lists better.
  html = html.replace(/^\s*([-*+]) +(.*)/gm, (match, bullet, content) => {
    // This basic replacement is tricky for nested lists without a full parser.
    // For now, ensuring each item becomes an <li> is the main goal.
    // The ul/ol wrapping will be handled by a more general regex or post-processing.
    return `<li>${content.trim()}</li>`;
  });
  // Wrap consecutive <li> elements in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
    return `<ul class="list-disc list-outside pl-5 my-2 space-y-1.5">${match}</ul>`;
  });
  
  // Paragraphs and line breaks
  // First, protect list structures from being broken by <br> tags
  html = html.replace(/<\/ul>\n<ul>/g, '</ul><ul>'); // Consolidate adjacent lists
  html = html.replace(/<\/li>\n<li>/g, '</li><li>'); // Consolidate list items
  
  // Convert newlines to <br />, but not inside list items or immediately after block elements
  html = html.split('\n').map(line => {
      if (line.match(/^\s*<li|^\s*<ul|^\s*<\/ul|^\s*<h[1-4]|^\s*<\/h[1-4]>/)) {
          return line; // Don't add <br> for lines starting with list/heading tags
      }
      return line.trim() === '' ? '<br class="my-1.5"/>' : `<p class="my-2 leading-relaxed font-body">${line}</p>`;
  }).join('').replace(/<\/p><p/g, '</p><br class="my-1.5"/><p'); // Ensure space between paragraphs

  // Cleanup excessive breaks and breaks around block elements
  html = html.replace(/<br \/>\s*<br \/>/g, '<br class="my-1.5"/>') 
    .replace(/(<\/ul>)<br class="my-1.5"\/>/g, '$1') 
    .replace(/<br class="my-1.5"\/>(<ul)/g, '$1')   
    .replace(/(<\/h[1-4]>)<br class="my-1.5"\/>/g, '$1') 
    .replace(/<br class="my-1.5"\/>(<h[1-4]>)/g, '$1')
    .replace(/<\/p><br class="my-1.5"\/>(<h[1-4]>)/g, '</p>$1')
    .replace(/(<\/h[1-4]>)<br class="my-1.5"\/>(<p)/g, '$1$2');
    
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
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: `Study Notes: ${topic}`,
      text: `Check out these AI-generated study notes for "${topic}" from StudyTrack!\nSummary: ${analysisResult.summary.substring(0,100)}...`,
      url: window.location.href, // Or a specific shareable link if you implement one
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support navigator.share
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
        toast({ title: "Link Copied!", description: "Link to these notes copied to clipboard." });
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast({ title: "Sharing Error", description: "Could not share at this moment.", variant: "destructive" });
    }
  };

  const handlePrint = () => {
    const notesElement = document.getElementById('structured-notes-content-for-pdf');
    if (notesElement) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<html><head><title>Print Notes - ${topic}</title>`);
            // Optional: Add styles for printing
            printWindow.document.write('<style> body { font-family: sans-serif; line-height: 1.6; } h1, h2, h3, h4 { margin-bottom: 0.5em; } ul { padding-left: 20px; } </style>');
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
    const notesElement = document.getElementById('structured-notes-content-for-pdf');
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
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps= pdf.getImageProperties(imgData);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let newImgWidth = pdfWidth - 20; 
      let newImgHeight = newImgWidth / aspectRatio;

      pdf.addImage(imgData, 'PNG', 10, 10, newImgWidth, newImgHeight);
      pdf.save(`${topic.replace(/[^a-zA-Z0-9]/g, '_') || 'study_notes'}.pdf`);
      toast({ title: "PDF Downloaded!", description: "Your notes have been saved as a PDF." });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF Generation Failed", description: "Could not generate PDF. Please try again.", variant: "destructive" });
    } finally {
      setIsDownloadingPdf(false);
    }
  };
  
  return (
    <div className="space-y-6 sm:space-y-8">
      <Tabs defaultValue="structuredNotes" className="w-full animate-in fade-in-50 duration-500">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 text-xs sm:text-sm h-auto rounded-xl shadow-md bg-muted/70 p-1">
          <TabsTrigger value="structuredNotes" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><FileText className="h-4 w-4" />Notes</TabsTrigger>
          <TabsTrigger value="summary" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><ClipboardList className="h-4 w-4" />Summary</TabsTrigger>
          <TabsTrigger value="keyConcepts" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><Sparkles className="h-4 w-4" />Key Concepts</TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 sm:py-3 flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-lg transition-all"><HelpCircle className="h-4 w-4" />Quick Quiz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="structuredNotes" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card/80 border-b gap-2">
              <div className="flex-grow">
                <CardTitle className="text-lg md:text-xl font-bold font-headline text-primary flex items-center">
                    <Brain className="mr-2 h-5 w-5 md:h-6 md:w-6 text-primary" /> AI-Generated Study Notes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">Topic: <span className="font-medium text-foreground">{topic}</span></CardDescription>
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
            <CardContent className="p-4 md:p-6 bg-background min-h-[300px]">
              <div id="structured-notes-content-for-pdf" className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed dark:text-gray-100 font-body">
                 <div dangerouslySetInnerHTML={{ __html: renderBasicMarkdown(analysisResult.structuredNotes) }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 sm:p-6 bg-card/80 border-b">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-primary"><ClipboardList className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Summary of Material</CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">Topic: {topic}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-background min-h-[200px]">
              <div className="prose prose-base lg:prose-lg max-w-none dark:prose-invert text-foreground leading-relaxed font-body">
                <p>{analysisResult.summary}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keyConcepts" className="mt-4">
          <Card className="shadow-lg border-border/70 rounded-xl overflow-hidden bg-card">
            <CardHeader className="p-4 sm:p-6 bg-card/80 border-b">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-primary"><Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Core Concepts Unpacked</CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">Main ideas from your material.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 bg-background min-h-[200px]">
              <ul className="space-y-2.5 text-base text-foreground/90 leading-relaxed font-body">
                {analysisResult.keyConcepts.map((concept, index) => (
                  <li key={`concept-${index}`} className="flex items-start p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/50 shadow-sm">
                      <CheckCircle className="mr-2 sm:mr-3 h-4 w-4 text-green-500 dark:text-green-400 shrink-0 mt-1" />
                      <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="mt-4">
            <CardHeader className="p-4 sm:p-6 bg-card/80 border-b rounded-t-xl">
              <CardTitle className="flex items-center text-lg sm:text-xl font-semibold text-primary"><HelpCircle className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Quick Quiz: Test Your Knowledge! 🧩</CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">See how well you've grasped the concepts.</CardDescription>
            </CardHeader>
            <div className="space-y-4 sm:space-y-6 p-0 bg-background rounded-b-xl">
              {Object.entries(mcqAnswers).map(([qIndexStr, mcqItem]) => {
                const questionIndex = parseInt(qIndexStr);
                const isCorrect = mcqItem.userSelectedOption === mcqItem.correctAnswerIndex;
                return (
                  <Card key={`mcq-${questionIndex}`} className="shadow-md border-border/50 rounded-lg overflow-hidden first:mt-0 last:mb-0 mx-2 sm:mx-0 my-2">
                    <CardContent className="p-3 sm:p-4">
                        <p className="font-semibold mb-2 sm:mb-3 text-base sm:text-md text-foreground dark:text-gray-100 leading-snug">
                        <span className="text-sm text-muted-foreground uppercase tracking-wide mr-1.5">Q{questionIndex + 1}:</span> {mcqItem.questionText}
                        </p>
                        <RadioGroup
                        value={mcqItem.userSelectedOption?.toString()}
                        onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                        disabled={mcqItem.answerRevealed}
                        className="space-y-1.5 sm:space-y-2"
                        >
                        {mcqItem.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                            <RadioGroupItem 
                                value={optionIndex.toString()} 
                                id={`q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                "h-4 w-4 sm:h-4 sm:w-4 border-muted-foreground/70 focus:ring-primary text-primary data-[state=checked]:border-primary",
                                mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600",
                                mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-600 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-600"
                                )}
                            />
                            <Label 
                                htmlFor={`q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                "font-normal text-sm text-foreground/90 dark:text-gray-100/90 leading-relaxed cursor-pointer",
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
                            className="mt-3 sm:mt-4 text-xs py-1.5 px-2.5 border-primary/70 text-primary hover:bg-primary/10"
                            disabled={mcqItem.userSelectedOption === undefined}
                        >
                            Show Answer
                        </Button>
                        )}
                        {mcqItem.answerRevealed && (
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
            </div>
        </TabsContent>
      </Tabs>
      <div className="mt-6 sm:mt-8 text-center p-4 sm:p-6 border-t border-border/50 bg-card/70 rounded-b-xl">
        <p className="text-md sm:text-lg font-semibold text-accent leading-relaxed">✨ Understanding is power! Use these insights to supercharge your learning. You're doing great! 💪</p>
      </div>
    </div>
  );
}

    
