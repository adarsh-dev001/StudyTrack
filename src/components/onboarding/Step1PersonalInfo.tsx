
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LANGUAGE_MEDIUMS, STUDY_MODES, EXAM_PHASES, PREVIOUS_ATTEMPTS_OPTIONS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form'; // Adjust path if necessary

function Step1PersonalInfoComponent() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={control}
        name="fullName"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Full Name <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">This will be your display name in the app.</FormDescription>
            <FormControl>
              <Input placeholder="e.g., Ada Lovelace" {...field} className="text-sm sm:text-base"/>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <FormField
          control={control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Age (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="e.g., 21" 
                  {...field} 
                  value={field.value === null ? '' : String(field.value)}
                  onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                  className="text-sm sm:text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm sm:text-base font-semibold">Location (Optional)</FormLabel>
              <FormDescription className="text-xs sm:text-sm">City or Region.</FormDescription>
              <FormControl>
                <Input placeholder="e.g., New Delhi, India" {...field} className="text-sm sm:text-base"/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={control}
        name="languageMedium"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Medium of Language for Exam <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select language medium" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {LANGUAGE_MEDIUMS.map(medium => (
                  <SelectItem key={medium.value} value={medium.value} className="text-sm sm:text-base">{medium.label}</SelectItem>
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
          <FormItem className="space-y-2 sm:space-y-3">
            <FormLabel className="text-sm sm:text-base font-semibold">Primary Study Mode (Optional)</FormLabel>
            <FormDescription className="text-xs sm:text-sm">How are you primarily preparing?</FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex flex-col space-y-1 sm:flex-row sm:flex-wrap sm:space-y-0 sm:gap-x-4 sm:gap-y-2"
              >
                {STUDY_MODES.map(mode => (
                  <FormItem key={mode.value} className="flex items-center space-x-2 space-y-0">
                    <FormControl><RadioGroupItem value={mode.value} /></FormControl>
                    <FormLabel className="font-normal text-xs sm:text-sm">{mode.label}</FormLabel>
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
            <FormLabel className="text-sm sm:text-base font-semibold">Current Exam Phase (Optional)</FormLabel>
            <FormDescription className="text-xs sm:text-sm">What stage of preparation are you in?</FormDescription>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select current phase" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EXAM_PHASES.map(phase => (
                  <SelectItem key={phase.value} value={phase.value} className="text-sm sm:text-base">{phase.label}</SelectItem>
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
            <FormLabel className="text-sm sm:text-base font-semibold">Previous Attempts (Optional)</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select number of previous attempts" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PREVIOUS_ATTEMPTS_OPTIONS.map(attempt => (
                  <SelectItem key={attempt.value} value={attempt.value} className="text-sm sm:text-base">{attempt.label}</SelectItem>
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

export default React.memo(Step1PersonalInfoComponent);
