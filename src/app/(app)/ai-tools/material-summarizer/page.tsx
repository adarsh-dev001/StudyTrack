
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Sparkles, ListChecks, HelpCircle, CheckCircle, XCircle, Lightbulb, ClipboardList } from 'lucide-react';
import { summarizeStudyMaterial, type SummarizeStudyMaterialOutput, type MCQ } from '@/ai/flows/summarize-study-material';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const summarizerFormSchema = z.object({
  material: z.string().min(50, { message: 'Study material must be at least 50 characters long.' }).max(10000, { message: 'Study material cannot exceed 10,000 characters.' }),
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }).max(100, { message: 'Topic cannot exceed 100 characters.' }),
});

type SummarizerFormData = z.infer<typeof summarizerFormSchema>;

interface MCQWithUserAnswer extends MCQ {
  userSelectedOption?: number;
  answerRevealed?: boolean;
}

export default function MaterialSummarizerPage() {
  const [analysisResult, setAnalysisResult] = useState<SummarizeStudyMaterialOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState<Record<number, MCQWithUserAnswer>>({});
  const { toast } = useToast();

  const form = useForm<SummarizerFormData>({
    resolver: zodResolver(summarizerFormSchema),
    defaultValues: {
      material: '',
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<SummarizerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    setMcqAnswers({});
    try {
      const result: SummarizeStudyMaterialOutput = await summarizeStudyMaterial(data);
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

  const handleShowAnswer = (questionIndex: number) => {
    setMcqAnswers(prev => ({
      ...prev,
      [questionIndex]: {
        ...prev[questionIndex],
        answerRevealed: true,
      }
    }));
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Wand2 className="mr-3 h-8 w-8 text-primary" /> AI Study Assistant
        </h1>
        <p className="text-lg text-muted-foreground">
          Paste study material to get a summary, key concepts, and a quick quiz. 📚
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Input Material 📝</CardTitle>
              <CardDescription>Provide the text and topic for analysis. (Note: PDF/DOCX/Image upload coming soon!)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Photosynthesis, Indian National Movement" {...field} />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Study Material (Text)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your study notes, textbook chapter, or article here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Enter the content you want to process (min 50 characters, max 10,000).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Insights
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisResult && (
        <>
          <Tabs defaultValue="summary" className="w-full animate-in fade-in-50 duration-500">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary"><ClipboardList className="mr-2 h-4 w-4" />Summary</TabsTrigger>
              <TabsTrigger value="keyConcepts"><Sparkles className="mr-2 h-4 w-4" />Key Concepts</TabsTrigger>
              <TabsTrigger value="quiz"><HelpCircle className="mr-2 h-4 w-4" />Quick Quiz</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center"><ClipboardList className="mr-2 h-5 w-5 text-primary" /> 📌 Summary of Your Material</CardTitle>
                  <CardDescription>Topic: {form.getValues('topic')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert text-foreground leading-relaxed">
                    <p>{analysisResult.summary}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keyConcepts">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" /> 🧠 Core Concepts Unpacked</CardTitle>
                  <CardDescription>The main ideas from your material.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2.5 text-foreground/90">
                    {analysisResult.keyConcepts.map((concept, index) => (
                      <li key={`concept-${index}`} className="flex items-start">
                          <CheckCircle className="mr-3 h-5 w-5 text-green-500 dark:text-green-400 shrink-0 mt-0.5" />
                          <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quiz">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center"><HelpCircle className="mr-2 h-5 w-5 text-primary" /> Quick Quiz: Test Your Knowledge! 🧩</CardTitle>
                  <CardDescription>See how well you've grasped the concepts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(mcqAnswers).map(([qIndexStr, mcqItem]) => {
                    const questionIndex = parseInt(qIndexStr);
                    const isCorrect = mcqItem.userSelectedOption === mcqItem.correctAnswerIndex;
                    return (
                      <div key={`mcq-${questionIndex}`} className="p-4 border rounded-lg bg-card/30 shadow-sm">
                        <p className="font-semibold mb-3 text-foreground">Question {questionIndex + 1}: {mcqItem.question}</p>
                        <RadioGroup
                          value={mcqItem.userSelectedOption?.toString()}
                          onValueChange={(value) => handleMcqOptionChange(questionIndex, value)}
                          disabled={mcqItem.answerRevealed}
                          className="space-y-2"
                        >
                          {mcqItem.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={optionIndex.toString()} 
                                id={`q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                  mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "border-green-500 ring-green-500 text-green-700",
                                  mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "border-red-500 ring-red-500 text-red-700"
                                )}
                              />
                              <Label 
                                htmlFor={`q${questionIndex}-opt${optionIndex}`}
                                className={cn(
                                  "font-normal",
                                  mcqItem.answerRevealed && optionIndex === mcqItem.correctAnswerIndex && "text-green-700 dark:text-green-400 font-medium",
                                  mcqItem.answerRevealed && optionIndex === mcqItem.userSelectedOption && optionIndex !== mcqItem.correctAnswerIndex && "text-red-700 dark:text-red-400"
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
                            className="mt-4"
                            disabled={mcqItem.userSelectedOption === undefined}
                          >
                            Show Answer
                          </Button>
                        )}
                        {mcqItem.answerRevealed && (
                          <div className={cn(
                              "mt-4 p-3 rounded-md text-sm",
                              isCorrect ? "bg-green-100 dark:bg-green-900/60 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200" 
                                        : "bg-red-100 dark:bg-red-900/60 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200"
                            )}
                          >
                            <div className="flex items-center font-semibold mb-1">
                              {isCorrect ? <CheckCircle className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" /> : <XCircle className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />}
                              {isCorrect ? "Correct! 🎉" : `Incorrect. The correct answer was: ${mcqItem.options[mcqItem.correctAnswerIndex]}`}
                            </div>
                            {mcqItem.explanation && (
                              <div className="mt-2 flex items-start">
                                 <Lightbulb className="mr-2 h-4 w-4 mt-0.5 text-yellow-600 dark:text-yellow-400 shrink-0" />
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
          <div className="mt-8 text-center p-4 border-t bg-card rounded-b-lg">
            <p className="text-md font-semibold text-accent">✨ Understanding is power! Use these insights to supercharge your learning. You're doing great! 💪</p>
          </div>
        </>
      )}
    </div>
  );
}

