
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TARGET_EXAMS, EXAM_ATTEMPT_YEARS, LANGUAGE_MEDIUMS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

export default function Step1ExamFocus() {
  const { control, watch } = useFormContext<OnboardingFormData>();
  const selectedExams = watch('targetExams') || [];

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="targetExams"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Target Exam(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription>Select the competitive exam(s) you are preparing for.</FormDescription>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2">
              {TARGET_EXAMS.map((exam) => (
                <FormField
                  key={exam.value}
                  control={control}
                  name="targetExams"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(exam.value)}
                            onCheckedChange={(checked) => {
                              const currentSelection = field.value || [];
                              return checked
                                ? field.onChange([...currentSelection, exam.value])
                                : field.onChange(currentSelection.filter((value) => value !== exam.value));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{exam.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedExams.includes('other') && (
         <FormField
            control={control}
            name="otherExamName" // You'll need to add this to your Zod schema if 'Other' is selected
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Specify Other Exam <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="E.g., GRE, GMAT, Specific State PSC" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
      )}


      <FormField
        control={control}
        name="examAttemptYear"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">Primary Exam Attempt Year <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EXAM_ATTEMPT_YEARS().map(year => (
                  <SelectItem key={year.value} value={year.value}>{year.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="languageMedium"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">Medium of Language for Exam <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select language medium" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {LANGUAGE_MEDIUMS.map(medium => (
                  <SelectItem key={medium.value} value={medium.value}>{medium.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
       {/* Placeholder for future fields like Optional Subjects, Phase, etc. */}
    </div>
  );
}
