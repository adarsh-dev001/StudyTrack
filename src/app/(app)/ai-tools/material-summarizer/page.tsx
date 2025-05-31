
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
import { Loader2, Wand2 } from 'lucide-react';
import { summarizeStudyMaterial, type SummarizeStudyMaterialInput, type SummarizeStudyMaterialOutput } from '@/ai/flows/summarize-study-material';
import { useToast } from '@/hooks/use-toast';

const summarizerFormSchema = z.object({
  material: z.string().min(50, { message: 'Study material must be at least 50 characters long.' }).max(10000, { message: 'Study material cannot exceed 10,000 characters.' }),
  topic: z.string().min(3, { message: 'Topic must be at least 3 characters long.' }).max(100, { message: 'Topic cannot exceed 100 characters.' }),
});

type SummarizerFormData = z.infer<typeof summarizerFormSchema>;

export default function MaterialSummarizerPage() {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    setSummary(null);
    try {
      const result: SummarizeStudyMaterialOutput = await summarizeStudyMaterial(data);
      setSummary(result.summary);
      toast({
        title: 'Summary Generated!',
        description: 'The AI has summarized your material.',
      });
    } catch (error: any) {
      console.error('Error summarizing material:', error);
      setSummary(null);
      toast({
        title: 'Error Summarizing',
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
          <Wand2 className="mr-3 h-8 w-8 text-primary" /> Study Material Summarizer
        </h1>
        <p className="text-lg text-muted-foreground">
          Paste your study material and let AI provide a concise summary.
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Input Material</CardTitle>
              <CardDescription>Provide the text and topic you want to summarize.</CardDescription>
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
                    <FormLabel>Study Material</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your study notes, textbook chapter, or article here..."
                        className="min-h-[200px] resize-y"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Enter the content you want to summarize (min 50 characters, max 10,000).
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
                    Summarizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-5 w-5" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {summary && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle>Generated Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
              <p>{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
