
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PREFERRED_LEARNING_STYLES, MOTIVATION_TYPES } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

export default function Step3LearningMotivation() {
  const { control } = useFormContext<OnboardingFormData>();

  return (
    <div className="space-y-4 md:space-y-6">
      <FormField
        control={control}
        name="preferredLearningStyles"
        render={() => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Preferred Learning Style(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">How do you learn best?</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
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
                        <FormLabel className="font-normal text-xs sm:text-sm">{style.label}</FormLabel>
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
          <FormItem className="space-y-2 sm:space-y-3">
            <FormLabel className="text-sm sm:text-base font-semibold">What Motivates You? <span className="text-destructive">*</span></FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-1.5 sm:space-y-2"
              >
                {MOTIVATION_TYPES.map(type => (
                  <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={type.value} />
                    </FormControl>
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
        name="age"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Age (Optional)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="e.g., 21" 
                {...field} 
                value={field.value === null ? '' : field.value} 
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
              <Input placeholder="e.g., New Delhi, India" {...field} className="text-sm sm:text-base" />
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
