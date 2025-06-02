
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Lightbulb, Zap, Brain, Award, TrendingUp, Rocket, Target as TargetIcon } from 'lucide-react'; // Added Award, TrendingUp, Rocket, TargetIcon
import { analyzeProductivityData, type AnalyzeProductivityDataInput, type AnalyzeProductivityDataOutput } from '@/ai/flows/analyze-productivity-data';
import { useToast } from '@/hooks/use-toast';

const productivityAnalyzerFormSchema = z.object({
  studyHours: z.coerce.number().min(0, { message: 'Study hours cannot be negative.' }).max(100, { message: 'Study hours seem too high for a week.' }),
  topicsCompleted: z.coerce.number().min(0, { message: 'Topics completed cannot be negative.' }),
  subjectPhysicsHours: z.coerce.number().min(0).optional(),
  subjectChemistryHours: z.coerce.number().min(0).optional(),
  subjectBiologyHours: z.coerce.number().min(0).optional(),
  subjectMathHours: z.coerce.number().min(0).optional(),
  subjectOtherHours: z.coerce.number().min(0).optional(),
  streakLength: z.coerce.number().min(0, { message: 'Streak length cannot be negative.' }),
  weeklyGoalsCompleted: z.coerce.number().min(0, { message: 'Weekly goals completed cannot be negative.' }),
});

type ProductivityAnalyzerFormData = z.infer<typeof productivityAnalyzerFormSchema>;

export default function ProductivityAnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeProductivityDataOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProductivityAnalyzerFormData>({
    resolver: zodResolver(productivityAnalyzerFormSchema),
    defaultValues: {
      studyHours: 0,
      topicsCompleted: 0,
      subjectPhysicsHours: 0,
      subjectChemistryHours: 0,
      subjectBiologyHours: 0,
      subjectMathHours: 0,
      subjectOtherHours: 0,
      streakLength: 0,
      weeklyGoalsCompleted: 0,
    },
  });

  const onSubmit: SubmitHandler<ProductivityAnalyzerFormData> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);

    const subjectWiseTimeDistribution: Record<string, number> = {};
    if (data.subjectPhysicsHours && data.subjectPhysicsHours > 0) subjectWiseTimeDistribution['Physics'] = data.subjectPhysicsHours;
    if (data.subjectChemistryHours && data.subjectChemistryHours > 0) subjectWiseTimeDistribution['Chemistry'] = data.subjectChemistryHours;
    if (data.subjectBiologyHours && data.subjectBiologyHours > 0) subjectWiseTimeDistribution['Biology'] = data.subjectBiologyHours;
    if (data.subjectMathHours && data.subjectMathHours > 0) subjectWiseTimeDistribution['Mathematics'] = data.subjectMathHours;
    if (data.subjectOtherHours && data.subjectOtherHours > 0) subjectWiseTimeDistribution['Other'] = data.subjectOtherHours;
    
    const inputForAI: AnalyzeProductivityDataInput = {
      studyHours: data.studyHours,
      topicsCompleted: data.topicsCompleted,
      subjectWiseTimeDistribution,
      streakLength: data.streakLength,
      weeklyGoalsCompleted: data.weeklyGoalsCompleted,
    };

    try {
      const result: AnalyzeProductivityDataOutput = await analyzeProductivityData(inputForAI);
      setAnalysisResult(result);
      toast({
        title: 'Analysis Complete! 📊',
        description: 'Your productivity insights are ready.',
      });
    } catch (error: any) {
      console.error('Error analyzing productivity data:', error);
      setAnalysisResult(null);
      toast({
        title: 'Error Analyzing Data 😥',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <Brain className="mr-3 h-8 w-8 text-primary" /> Productivity Analysis AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Input your weekly study data to get AI-driven insights and recommendations. 📈
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Your Weekly Study Data 🗓️</CardTitle>
              <CardDescription>Provide your study metrics for the past week to get AI feedback.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="studyHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Study Hours (Weekly) ⏳</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topicsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Topics Completed (Weekly) ✅</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Card className="border-border/70 bg-muted/30">
                <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-lg">Subject-wise Time Distribution (Hours) 📚</CardTitle>
                    <CardDescription className="text-sm">Enter hours spent on each subject this week. Leave blank or 0 if not applicable.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <FormField control={form.control} name="subjectPhysicsHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Physics</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectChemistryHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Chemistry</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectBiologyHours" render={({ field }) => (
                       <FormItem><FormLabel className="text-sm">Biology</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectMathHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Mathematics</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectOtherHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Other Subjects</FormLabel><FormControl><Input type="number" placeholder="e.g., 2" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <FormField
                  control={form.control}
                  name="streakLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Study Streak (Days) 🔥</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} />
                      </FormControl>
                      <FormDescription>How many consecutive days have you studied?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyGoalsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Goals Completed 🎯</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 3 of 5" {...field} />
                      </FormControl>
                      <FormDescription>How many of your set weekly goals did you achieve?</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} size="lg" className="w-full sm:w-auto">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-5 w-5" />
                    Get AI Insights
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {analysisResult && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500 mt-6">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary flex items-center">
                <Zap className="mr-2 h-6 w-6" /> 🚀 Your AI Productivity Analysis!
            </CardTitle>
            <CardDescription>Here's what the AI thinks about your study habits this week.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-secondary/40 rounded-lg border border-border">
              <h3 className="font-semibold text-xl mb-2 text-foreground flex items-center">
                <Award className="mr-2 h-5 w-5 text-accent" /> Overall Assessment Snapshot:
              </h3>
              <p className="text-muted-foreground leading-relaxed">{analysisResult.overallAssessment}</p>
            </div>
            
            {analysisResult.insights && analysisResult.insights.length > 0 && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-xl mb-3 text-foreground flex items-center">
                  <Lightbulb className="mr-2 h-5 w-5 text-yellow-500 dark:text-yellow-400" /> Personalized Insights Unlocked:
                </h3>
                <ul className="space-y-2.5 text-muted-foreground">
                  {analysisResult.insights.map((insight, index) => (
                    <li key={`insight-${index}`} className="py-1 flex items-start">
                        <TrendingUp className="mr-3 h-5 w-5 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                        <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <div className="p-4 bg-card rounded-lg border border-border">
                <h3 className="font-semibold text-xl mb-3 text-foreground flex items-center">
                  <Rocket className="mr-2 h-5 w-5 text-green-500 dark:text-green-400" /> Your Action Plan for Success:
                </h3>
                <ul className="space-y-2.5 text-muted-foreground">
                  {analysisResult.recommendations.map((rec, index) => (
                    <li key={`rec-${index}`} className="py-1 flex items-start">
                        <TargetIcon className="mr-3 h-5 w-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
           <CardFooter className="pt-6 border-t mt-6 bg-secondary/20 rounded-b-lg">
            <p className="text-md text-center w-full text-accent-foreground/90 font-semibold">
                🙌 Keep crushing those goals! Small improvements lead to big wins. You're on the path to success!
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
    
