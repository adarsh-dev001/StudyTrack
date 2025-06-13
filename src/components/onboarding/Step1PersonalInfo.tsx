
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGE_MEDIUMS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

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
      
      <FormField
        control={control}
        name="languageMedium"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Medium of Language for Exam <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">This helps us tailor content and AI responses.</FormDescription>
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
    </div>
  );
}

export default React.memo(Step1PersonalInfoComponent);
