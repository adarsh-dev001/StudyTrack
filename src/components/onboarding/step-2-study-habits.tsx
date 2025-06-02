
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DAILY_STUDY_HOURS_OPTIONS, PREFERRED_STUDY_TIMES, SUBJECT_OPTIONS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

export default function Step2StudyHabits() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="dailyStudyHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">Average Daily Study Hours <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select study hours" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DAILY_STUDY_HOURS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="preferredStudyTime"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Preferred Study Time(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription>When are you most productive?</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-2">
              {PREFERRED_STUDY_TIMES.map((time) => (
                <FormField
                  key={time.id}
                  control={control}
                  name="preferredStudyTime"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(time.id)}
                            onCheckedChange={(checked) => {
                              const currentSelection = field.value || [];
                              return checked
                                ? field.onChange([...currentSelection, time.id])
                                : field.onChange(currentSelection.filter((value) => value !== time.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{time.label}</FormLabel>
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

      <FormField
        control={control}
        name="weakSubjects"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Weak Subject(s) (Optional)</FormLabel>
            <FormDescription>Which subjects do you find challenging?</FormDescription>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 pt-2">
              {SUBJECT_OPTIONS.map((subject) => (
                <FormField
                  key={subject.id}
                  control={control}
                  name="weakSubjects"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(subject.id)}
                            onCheckedChange={(checked) => {
                              const currentSelection = field.value || [];
                              return checked
                                ? field.onChange([...currentSelection, subject.id])
                                : field.onChange(currentSelection.filter((value) => value !== subject.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{subject.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage /> {/* Should ideally show if validation for min selection is added and fails */}
          </FormItem>
        )}
      />
      {/* Placeholder for Strong Subjects if needed */}
    </div>
  );
}
