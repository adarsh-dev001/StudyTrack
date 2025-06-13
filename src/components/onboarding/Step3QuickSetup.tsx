
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PREPARATION_LEVELS } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

const simplifiedPreparationLevels = [
  { value: 'beginner', label: 'Just starting / Exploring topics' },
  { value: 'intermediate', label: 'Actively studying / Mid-preparation' },
  { value: 'advanced', label: 'Near exam / Revision phase' },
];

function Step3QuickSetupComponent() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={control}
        name="preparationLevel"
        render={({ field }) => (
          <FormItem className="space-y-2 sm:space-y-3">
            <FormLabel className="text-sm sm:text-base font-semibold">
              What's Your Current Preparation Stage? <span className="text-destructive">*</span>
            </FormLabel>
            <FormDescription className="text-xs sm:text-sm">
              This helps us understand your current needs.
            </FormDescription>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex flex-col space-y-1.5 sm:space-y-2 pt-1"
              >
                {simplifiedPreparationLevels.map((level) => (
                  <FormItem key={level.value} className="flex items-center space-x-3 space-y-0 p-2 rounded-md border border-transparent hover:border-primary/50 hover:bg-accent/50 transition-colors">
                    <FormControl>
                      <RadioGroupItem value={level.value} />
                    </FormControl>
                    <FormLabel className="font-normal text-xs sm:text-sm cursor-pointer w-full">
                      {level.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="pt-2">
        <p className="text-xs text-muted-foreground text-center">
          You can always add more details like specific subjects, study habits, and goals later in your profile settings for even more personalized AI assistance!
        </p>
      </div>
    </div>
  );
}

export default React.memo(Step3QuickSetupComponent);
