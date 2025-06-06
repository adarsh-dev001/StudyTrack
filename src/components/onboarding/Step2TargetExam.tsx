
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TARGET_EXAMS, EXAM_ATTEMPT_YEARS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

function Step2TargetExamComponent() {
  const { control, watch } = useFormContext<OnboardingFormData>();
  const selectedExams = watch('targetExams') || [];

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={control}
        name="targetExams"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Target Exam(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">Select the competitive exam(s) you are preparing for. You can select multiple.</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
              {(TARGET_EXAMS || []).map((exam) => (
                <FormItem key={exam.value} className="flex flex-row items-center space-x-2 space-y-0">
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
                  <FormLabel className="font-normal text-xs sm:text-sm">{exam.label}</FormLabel>
                </FormItem>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {selectedExams.includes('other') && (
         <FormField
            control={control}
            name="otherExamName"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-sm sm:text-base font-semibold">If 'Other', please specify <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                        <Input placeholder="E.g., GRE, GMAT, Specific State PSC" {...field} className="text-sm sm:text-base"/>
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
            <FormLabel className="text-sm sm:text-base font-semibold">Primary Exam Attempt Year <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(EXAM_ATTEMPT_YEARS() || []).map(year => (
                  <SelectItem key={year.value} value={year.value} className="text-sm sm:text-base">{year.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default React.memo(Step2TargetExamComponent);
