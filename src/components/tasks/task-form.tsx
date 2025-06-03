
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { subjects } from '@/components/planner/planner-utils'; // Reusing subjects from planner
import type { TaskPriority } from './task-item'; // Import TaskPriority

const taskFormSchema = z.object({
  title: z.string().min(1, { message: 'Task title cannot be empty' }).max(150, { message: 'Title too long (max 150 chars)' }),
  subject: z.string().min(1, { message: 'Please select a subject' }),
  deadline: z.date().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high'] as const),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmitTask: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>; // For editing
  isEditMode?: boolean;
}

export function TaskForm({ onSubmitTask, initialData, isEditMode = false }: TaskFormProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialData || {
      title: '',
      subject: subjects[0]?.id || '', // Default to first subject or empty
      deadline: null,
      priority: 'medium',
    },
  });

  const { handleSubmit, control, reset, watch } = form;
  const watchedDeadline = watch("deadline");

  const handleFormSubmit: SubmitHandler<TaskFormData> = (data) => {
    onSubmitTask(data);
    if (!isEditMode) {
      reset({ title: '', subject: subjects[0]?.id || '', deadline: null, priority: 'medium' });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="taskTitle">Task Title / Topic <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input id="taskTitle" placeholder="e.g., Solve Chapter 3 problems, Read Modern History notes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="subject">Subject <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel htmlFor="deadline">Deadline (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        id="deadline"
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date)}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="priority">Priority <span className="text-destructive">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          {isEditMode ? 'Save Changes' : 'Add Task'}
        </Button>
      </form>
    </Form>
  );
}
