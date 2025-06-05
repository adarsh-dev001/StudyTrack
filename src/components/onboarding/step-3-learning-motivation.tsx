
'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PREFERRED_LEARNING_STYLES, MOTIVATION_TYPES } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

// This file is deleted as its functionality is merged into Step1PersonalInfo.tsx and Step4StudyPreferences.tsx
// Keeping an empty export to satisfy module resolution if it's still imported somewhere temporarily.
export default function Step3LearningMotivation_DEPRECATED() {
  return null;
}
