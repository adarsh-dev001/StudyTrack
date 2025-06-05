
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DAILY_STUDY_HOURS_OPTIONS, PREFERRED_STUDY_TIMES, MOTIVATION_TYPES } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

export default function Step4StudyPreferences() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={control}
        name="dailyStudyHours"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Average Daily Study Hours <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select study hours" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {DAILY_STUDY_HOURS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-sm sm:text-base">{option.label}</SelectItem>
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
            <FormLabel className="text-sm sm:text-base font-semibold">Preferred Study Time(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">When are you most productive?</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
              {PREFERRED_STUDY_TIMES.map((time) => (
                <FormField
                  key={time.id}
                  control={control}
                  name="preferredStudyTime"
                  render={({ field }) => (
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
                      <FormLabel className="font-normal text-xs sm:text-sm">{time.label}</FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="distractionStruggles"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Distraction Struggles (Optional)</FormLabel>
            <FormDescription className="text-xs sm:text-sm">What are your main distractions or challenges in staying focused?</FormDescription>
            <FormControl>
              <Textarea
                placeholder="e.g., Social media, noise, procrastination..."
                className="resize-y min-h-[70px] sm:min-h-[80px] text-sm sm:text-base"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="motivationType"
        render={({ field }) => (
          <FormItem className="space-y-2 sm:space-y-3">
            <FormLabel className="text-sm sm:text-base font-semibold">What Motivates You Most? <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex flex-col space-y-1.5 sm:space-y-2"
              >
                {MOTIVATION_TYPES.map(type => (
                  <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value={type.value} /></FormControl>
                    <FormLabel className="font-normal text-xs sm:text-sm">{type.label}</FormLabel>
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
        name="socialVisibilityPublic"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start sm:items-center space-x-3 space-y-0 rounded-md border p-3 sm:p-4 shadow-sm bg-background">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-0.5 sm:space-y-1 leading-none">
              <FormLabel className="text-sm sm:text-base font-semibold">
                Make Profile Public (Optional)
              </FormLabel>
              <FormDescription className="text-xs sm:text-sm">
                Allow others to see your anonymized progress on leaderboards or community features.
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}
