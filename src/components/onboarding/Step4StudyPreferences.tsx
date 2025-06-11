'use client';

import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DAILY_STUDY_HOURS_OPTIONS, PREFERRED_STUDY_TIMES, MOTIVATION_TYPES, PREFERRED_LEARNING_STYLES, EXAM_SUBJECT_MAP } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';

function Step4StudyPreferencesComponent() {
  const { control, setValue, getValues } = useFormContext<OnboardingFormData>();
  const watchedTargetExams = useWatch({ control, name: 'targetExams' });

  const subjectsForForm = React.useMemo(() => {
    const primaryExamValue = watchedTargetExams?.[0]?.toLowerCase();
    // If no exam is selected, or if it's 'other' and not further specified,
    // it might be better to default to a generic list or an empty list.
    // For now, using 'other' as a fallback if primaryExamValue isn't found.
    return EXAM_SUBJECT_MAP[primaryExamValue || 'other'] || EXAM_SUBJECT_MAP['other'] || [];
  }, [watchedTargetExams]);

  // Effect to clear/filter selected weak/strong subjects if targetExams changes
  React.useEffect(() => {
    const currentWeakSubjects = getValues('weakSubjects') || [];
    const currentStrongSubjects = getValues('strongSubjects') || [];
    const validSubjectIds = subjectsForForm.map(s => s.id);

    const filteredWeakSubjects = currentWeakSubjects.filter(id => validSubjectIds.includes(id));
    if (filteredWeakSubjects.length !== currentWeakSubjects.length) {
      setValue('weakSubjects', filteredWeakSubjects, { shouldDirty: true });
    }

    const filteredStrongSubjects = currentStrongSubjects.filter(id => validSubjectIds.includes(id));
    if (filteredStrongSubjects.length !== currentStrongSubjects.length) {
      setValue('strongSubjects', filteredStrongSubjects, { shouldDirty: true });
    }
  }, [subjectsForForm, getValues, setValue]);


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
                {(DAILY_STUDY_HOURS_OPTIONS || []).map(option => (
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
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Preferred Study Time(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">When are you most productive?</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
              {(PREFERRED_STUDY_TIMES || []).map((time) => (
                <FormItem key={time.id} className="flex flex-row items-center space-x-2 space-y-0">
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
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="weakSubjects"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Weak Subject(s) (Optional)</FormLabel>
            <FormDescription className="text-xs sm:text-sm">Select subjects you find challenging from the list relevant to your exam.</FormDescription>
            {subjectsForForm.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
                {(subjectsForForm || []).map((subjectOption) => (
                  <FormItem key={subjectOption.id + "-weak-onboarding"} className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(subjectOption.id)}
                        onCheckedChange={(checked) => {
                          const currentSelectedSubjects = field.value || [];
                          return checked
                            ? field.onChange([...currentSelectedSubjects, subjectOption.id])
                            : field.onChange(currentSelectedSubjects.filter((value) => value !== subjectOption.id));
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-xs sm:text-sm">{subjectOption.name}</FormLabel>
                  </FormItem>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">Select an exam in Step 2 to see relevant subjects here.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="strongSubjects"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">Strong Subject(s) (Optional)</FormLabel>
            <FormDescription className="text-xs sm:text-sm">Select subjects you are confident in from the list relevant to your exam.</FormDescription>
             {subjectsForForm.length > 0 ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
                {(subjectsForForm || []).map((subjectOption) => (
                  <FormItem key={subjectOption.id + "-strong-onboarding"} className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(subjectOption.id)}
                        onCheckedChange={(checked) => {
                          const currentSelectedSubjects = field.value || [];
                          return checked
                            ? field.onChange([...currentSelectedSubjects, subjectOption.id])
                            : field.onChange(currentSelectedSubjects.filter((value) => value !== subjectOption.id));
                        }}
                      />
                    </FormControl>
                    <FormLabel className="font-normal text-xs sm:text-sm">{subjectOption.name}</FormLabel>
                  </FormItem>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground pt-1">Select an exam in Step 2 to see relevant subjects here.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
       <FormField
        control={control}
        name="preferredLearningStyles"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm sm:text-base font-semibold">General Preferred Learning Style(s) <span className="text-destructive">*</span></FormLabel>
            <FormDescription className="text-xs sm:text-sm">How do you prefer to learn overall? (You can specify per subject too).</FormDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 sm:gap-x-4 sm:gap-y-3 pt-1 sm:pt-2">
              {(PREFERRED_LEARNING_STYLES || []).map((styleOption) => (
                <FormItem key={styleOption.id + "-general-onboarding"} className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(styleOption.id)}
                      onCheckedChange={(checked) => {
                        const currentSelectedStyles = field.value || [];
                        return checked
                          ? field.onChange([...currentSelectedStyles, styleOption.id])
                          : field.onChange(currentSelectedStyles.filter((value) => value !== styleOption.id));
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal text-xs sm:text-sm">{styleOption.label}</FormLabel>
                </FormItem>
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
            <FormControl><RadioGroup onValueChange={field.onChange} value={field.value || ''} className="flex flex-col space-y-1.5 sm:space-y-2">
                {(MOTIVATION_TYPES || []).map(type => (
                  <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                    <FormControl><RadioGroupItem value={type.value} /></FormControl><FormLabel className="font-normal text-xs sm:text-sm">{type.label}</FormLabel>
                  </FormItem>))}
            </RadioGroup></FormControl><FormMessage />
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
                checked={!!field.value} 
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-0.5 sm:space-y-1 leading-none"><FormLabel className="text-sm sm:text-base font-semibold">
                Make Profile Public (Optional)
              </FormLabel><FormDescription className="text-xs sm:text-sm">
                Allow others to see your anonymized progress on leaderboards or community features.
              </FormDescription></div>
          </FormItem>
        )}
      />
    </div>
  );
}

export default React.memo(Step4StudyPreferencesComponent);
