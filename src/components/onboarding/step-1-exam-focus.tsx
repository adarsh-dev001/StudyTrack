
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TARGET_EXAMS, EXAM_ATTEMPT_YEARS, LANGUAGE_MEDIUMS, STUDY_MODES, EXAM_PHASES, PREVIOUS_ATTEMPTS_OPTIONS } from '@/lib/constants';
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 pt-2">
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
            name="otherExamName"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>If 'Other', please specify <span className="text-destructive">*</span></FormLabel>
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
      
      <FormField
        control={control}
        name="studyMode"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="font-semibold">Study Mode</FormLabel>
             <FormDescription>How are you primarily preparing?</FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
              >
                {STUDY_MODES.map(mode => (
                  <FormItem key={mode.value} className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={mode.value} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">{mode.label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="examPhase"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">Current Exam Phase</FormLabel>
            <FormDescription>What stage of preparation are you in?</FormDescription>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select current phase" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EXAM_PHASES.map(phase => (
                  <SelectItem key={phase.value} value={phase.value}>{phase.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="previousAttempts"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">Previous Attempts (if any)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select number of previous attempts" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PREVIOUS_ATTEMPTS_OPTIONS.map(attempt => (
                  <SelectItem key={attempt.value} value={attempt.value}>{attempt.label}</SelectItem>
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
