
'use client';

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PlusCircle } from 'lucide-react';

const taskFormSchema = z.object({
  title: z.string().min(1, { message: 'Task title cannot be empty' }),
});

export type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmitTask: (data: TaskFormData) => void;
}

export function TaskForm({ onSubmitTask }: TaskFormProps) {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting } } = form;

  const handleFormSubmit: SubmitHandler<TaskFormData> = (data) => {
    onSubmitTask(data);
    reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex items-start gap-4 mb-6">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel htmlFor="taskTitle" className="sr-only">Task Title</FormLabel>
              <FormControl>
                <Input id="taskTitle" placeholder="Enter a new task..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} aria-label="Add task">
          <PlusCircle className="mr-2 h-5 w-5 md:hidden" />
          <span className="hidden md:inline">Add Task</span>
        </Button>
      </form>
    </Form>
  );
}
