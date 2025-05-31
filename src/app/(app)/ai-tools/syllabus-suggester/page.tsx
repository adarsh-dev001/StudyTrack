
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BookText, ListTree } from 'lucide-react';
import { suggestStudyTopics, type SuggestStudyTopicsInput, type SuggestStudyTopicsOutput } from '@/ai/flows/suggest-study-topics';
import { useToast } from '@/hooks/use-toast';

const syllabusFormSchema = z.object({
  examType: z.string().min(3, { message: 'Exam type must be at least 3 characters long.' }).max(50, { message: 'Exam type cannot exceed 50 characters.' }),
});

type SyllabusFormData = z.infer<typeof syllabusFormSchema>;

const predefinedExams = [
  { value: 'NEET', label: 'NEET (National Eligibility cum Entrance Test)' },
  { value: 'UPSC', label: 'UPSC (Union Public Service Commission)' },
  { value: 'JEE Main', label: 'JEE Main (Joint Entrance Examination Main)' },
  { value: 'JEE Advanced', label: 'JEE Advanced (Joint Entrance Examination Advanced)' },
  { value: 'CAT', label: 'CAT (Common Admission Test)' },
  { value: 'GATE', label: 'GATE (Graduate Aptitude Test in Engineering)' },
];

export default function SyllabusSuggesterPage() {
  const [suggestedTopics, setSuggestedTopics] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SyllabusFormData>({
    resolver: zodResolver(syllabusFormSchema),
    defaultValues: {
      examType: '',
    },
  });

  const onSubmit: SubmitHandler<SyllabusFormData> = async (data) => {
    setIsLoading(true);
    setSuggestedTopics(null);
    try {
      const result: SuggestStudyTopicsOutput = await suggestStudyTopics(data);
      setSuggestedTopics(result.topics);
      toast({
        title: 'Syllabus Suggested!',
        description: `Topics for ${data.examType} have been generated.`,
      });
    } catch (error: any) {
      console.error('Error suggesting topics:', error);
      setSuggestedTopics(null);
      toast({
        title: 'Error Generating Suggestions',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-none px-0 mx-0 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center">
          <ListTree className="mr-3 h-8 w-8 text-primary" /> AI Syllabus Suggester
        </h1>
        <p className="text-lg text-muted-foreground">
          Enter your exam type and let AI suggest relevant study topics.
        </p>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Exam Information</CardTitle>
              <CardDescription>Select or enter the exam you are preparing for.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="examType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Type</FormLabel>
                    <div className="flex gap-2">
                        <Select
                            onValueChange={(value) => {
                                field.onChange(value); // Update react-hook-form
                                if (value !== 'custom') {
                                    form.setValue('examType', value, { shouldValidate: true });
                                } else {
                                    form.setValue('examType', '', { shouldValidate: true }); // Clear if custom is chosen, user types in Input
                                }
                            }}
                            defaultValue={predefinedExams.find(exam => exam.value === field.value)?.value || ""}
                        >
                        <FormControl>
                            <SelectTrigger className="w-2/3">
                            <SelectValue placeholder="Select a common exam..." />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {predefinedExams.map((exam) => (
                            <SelectItem key={exam.value} value={exam.value}>
                                {exam.label}
                            </SelectItem>
                            ))}
                            <SelectItem value="custom">Other (Specify Below)</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormControl className="flex-1">
                            <Input
                                placeholder="Or type custom exam"
                                {...field} // field includes value, onChange, onBlur, name, ref
                                value={form.watch('examType')} // Ensure input reflects the true form value
                                onChange={(e) => {
                                    form.setValue('examType', e.target.value, {shouldValidate: true});
                                }}
                            />
                        </FormControl>
                    </div>
                    <FormDescription>
                      Select from the list or type the name of your competitive exam.
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
                    Generating Suggestions...
                  </>
                ) : (
                  <>
                    <ListTree className="mr-2 h-5 w-5" />
                    Suggest Topics
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {suggestedTopics && suggestedTopics.length > 0 && (
        <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle>Suggested Study Topics for {form.getValues('examType')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-foreground">
              {suggestedTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {suggestedTopics === null && !isLoading && form.formState.isSubmitted && (
         <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle>No Topics Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI could not generate topics for the specified exam, or the list was empty. Please try a different exam or ensure it's a recognized competitive exam.</p>
          </CardContent>
        </Card>
      )}
       {suggestedTopics && suggestedTopics.length === 0 && !isLoading && (
         <Card className="shadow-lg animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle>No Topics Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The AI did not return any topics for {form.getValues('examType')}. Please ensure it's a recognized competitive exam or try a broader category.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
