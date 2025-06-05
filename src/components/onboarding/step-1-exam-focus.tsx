
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

// This file is deleted as its functionality is merged into Step1PersonalInfo.tsx and Step2TargetExam.tsx
// Keeping an empty export to satisfy module resolution if it's still imported somewhere temporarily.
export default function Step1ExamFocus_DEPRECATED() {
  return null;
}
