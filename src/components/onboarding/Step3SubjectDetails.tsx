
'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
// Button import removed as it's not used
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'; // CardDescription removed as not used
import { ScrollArea } from '@/components/ui/scroll-area';
import { EXAM_SUBJECT_MAP, PREPARATION_LEVELS, PREFERRED_LEARNING_METHODS_PER_SUBJECT } from '@/lib/constants';
import type { OnboardingFormData } from './onboarding-form';
import { cn } from '@/lib/utils';

interface Step3SubjectDetailsProps {
  selectedExam: string | undefined; 
}

export default function Step3SubjectDetails({ selectedExam }: Step3SubjectDetailsProps) {
  const { control, getValues, setValue, formState: { errors } } = useFormContext<OnboardingFormData>();
  
  const subjectsForSelectedExam = React.useMemo(() => {
    if (!selectedExam) return EXAM_SUBJECT_MAP['other']; 
    return EXAM_SUBJECT_MAP[selectedExam] || EXAM_SUBJECT_MAP['other'];
  }, [selectedExam]);

  const { fields } = useFieldArray({
    control,
    name: "subjectDetails",
  });

  React.useEffect(() => {
    const currentSubjectDetails = getValues('subjectDetails') || [];
    const newSubjectDetails = subjectsForSelectedExam.map(examSubject => {
      const existingDetail = currentSubjectDetails.find(sd => sd.subjectId === examSubject.id);
      return existingDetail || {
        subjectId: examSubject.id,
        subjectName: examSubject.name,
        preparationLevel: '',
        targetScore: '',
        preferredLearningMethods: [],
      };
    });

    if (JSON.stringify(currentSubjectDetails.map(sd => sd.subjectId).sort()) !== JSON.stringify(newSubjectDetails.map(nsd => nsd.subjectId).sort()) ||
        currentSubjectDetails.length !== newSubjectDetails.length) {
        setValue('subjectDetails', newSubjectDetails, { shouldValidate: true, shouldDirty: true });
    }

  }, [subjectsForSelectedExam, setValue, getValues]);


  return (
    <div className="space-y-4 md:space-y-6">
      <FormDescription className="text-xs sm:text-sm">
        For each subject relevant to your selected exam(s), please provide some details.
        Required fields are marked with <span className="text-destructive">*</span>.
      </FormDescription>

      {fields.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Please select your target exam in the previous step to see relevant subjects, or add custom subjects if you chose 'Other'.
        </p>
      )}

      <ScrollArea className={cn("max-h-[450px] -mr-3 pr-3", fields.length > 2 && "h-[450px]")}>
        <div className="space-y-4 md:space-y-6">
          {fields.map((field, index) => (
            <Card key={field.id} className="bg-card/50">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base sm:text-lg font-semibold">{field.subjectName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4 px-4 pb-4">
                <FormField
                  control={control}
                  name={`subjectDetails.${index}.preparationLevel`}
                  render={({ field: controllerField }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium">Preparation Level <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={controllerField.onChange} value={controllerField.value || ''}>
                        <FormControl><SelectTrigger className="text-xs sm:text-sm h-9"><SelectValue placeholder="Select level" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {PREPARATION_LEVELS.map(level => (
                            <SelectItem key={level.value} value={level.value} className="text-xs sm:text-sm">{level.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`subjectDetails.${index}.targetScore`}
                  render={({ field: controllerField }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium">Target Score/Rank (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., 90%+, Top 1000" {...controllerField} value={controllerField.value || ''} className="text-xs sm:text-sm h-9" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`subjectDetails.${index}.preferredLearningMethods`}
                  render={({ field: controllerField }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm font-medium">Preferred Learning Methods <span className="text-destructive">*</span></FormLabel>
                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-2 gap-y-1.5 pt-0.5">
                        {PREFERRED_LEARNING_METHODS_PER_SUBJECT.map((method) => (
                          <FormItem key={method.id} className="flex flex-row items-center space-x-1.5 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={controllerField.value?.includes(method.id)}
                                onCheckedChange={(checked) => {
                                  const currentSelection = controllerField.value || [];
                                  return checked
                                    ? controllerField.onChange([...currentSelection, method.id])
                                    : controllerField.onChange(currentSelection.filter((val) => val !== method.id));
                                }}
                                className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-[11px] sm:text-xs">{method.label}</FormLabel>
                          </FormItem>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
      {/* @ts-ignore TODO: Fix this type error, related to Zod an array validation */}
      {errors.subjectDetails && !errors.subjectDetails.root && !errors.subjectDetails.message && (
        <p className="text-sm font-medium text-destructive">Please provide details for all listed subjects.</p>
      )}
       {/* @ts-ignore */}
      {errors.subjectDetails?.root?.message && <p className="text-sm font-medium text-destructive">{errors.subjectDetails.root.message}</p>}
      {/* @ts-ignore */}
      {errors.subjectDetails?.message && <p className="text-sm font-medium text-destructive">{errors.subjectDetails.message}</p>}
    </div>
  );
}
