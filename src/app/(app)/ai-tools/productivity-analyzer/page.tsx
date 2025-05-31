
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, BarChartBig, Lightbulb } from 'lucide-react';
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
    
    // Ensure at least one subject is provided if any specific subject hour is greater than 0
    // or if total study hours > 0 and no specific subjects are detailed, send an empty object or handle as per AI's expectation.
    // For now, we send what we have. The AI prompt can be adjusted if it needs specific handling for empty subjectWiseTimeDistribution.

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
        title: 'Analysis Complete!',
        description: 'Your productivity insights are ready.',
      });
    } catch (error: any) {
      console.error('Error analyzing productivity data:', error);
      setAnalysisResult(null);
      toast({
        title: 'Error Analyzing Data',
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
          <BarChartBig className="mr-3 h-8 w-8 text-primary" /> Productivity Analysis AI
        </h1>
        <p className="text-lg text-muted-foreground">
          Input your weekly study data to get AI-driven insights and recommendations.
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Weekly Study Data</CardTitle>
              <CardDescription>Provide your study metrics for the past week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="studyHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Study Hours</FormLabel>
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
                      <FormLabel>Topics Completed</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Card>
                <CardHeader className="pb-2 pt-4">
                    <CardTitle className="text-lg">Subject-wise Time Distribution (Hours)</CardTitle>
                    <CardDescription className="text-xs">Enter hours spent on each subject. Leave blank or 0 if not applicable.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                    <FormField control={form.control} name="subjectPhysicsHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Physics</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectChemistryHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Chemistry</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectBiologyHours" render={({ field }) => (
                       <FormItem><FormLabel className="text-sm">Biology</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectMathHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Mathematics</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="subjectOtherHours" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Other Subjects</FormLabel><FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="streakLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Study Streak (Days)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 7" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyGoalsCompleted"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Goals Completed</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 3" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} size="lg">
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
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle>AI Productivity Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1 text-primary">Overall Assessment:</h3>
              <p className="text-foreground/90">{analysisResult.overallAssessment}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-primary">Personalized Insights:</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                {analysisResult.insights.map((insight, index) => (
                  <li key={`insight-${index}`}>{insight}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1 text-primary">Actionable Recommendations:</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                {analysisResult.recommendations.map((rec, index) => (
                  <li key={`rec-${index}`}>{rec}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
