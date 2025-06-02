
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PREFERRED_LEARNING_STYLES, MOTIVATION_TYPES } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

export default function Step3LearningMotivation() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="preferredLearningStyles"
        render={() => (
          <FormItem>
            <FormLabel className="text-base font-semibold">Preferred Learning Style(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription>How do you learn best?</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-2">
              {PREFERRED_LEARNING_STYLES.map((style) => (
                <FormField
                  key={style.id}
                  control={control}
                  name="preferredLearningStyles"
                  render={({ field }) => {
                    return (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(style.id)}
                            onCheckedChange={(checked) => {
                              const currentSelection = field.value || [];
                              return checked
                                ? field.onChange([...currentSelection, style.id])
                                : field.onChange(currentSelection.filter((value) => value !== style.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal text-sm">{style.label}</FormLabel>
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
        name="motivationType"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-base font-semibold">What Motivates You? <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-2"
              >
                {MOTIVATION_TYPES.map(type => (
                  <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={type.value} />
                    </FormControl>
                    <FormLabel className="font-normal text-sm">{type.label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {/* Placeholders for Social Visibility, Distraction Struggles etc. */}
    </div>
  );
}
