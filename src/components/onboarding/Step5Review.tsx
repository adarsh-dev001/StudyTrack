
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OnboardingFormData } from './onboarding-form';
import { TARGET_EXAMS, EXAM_ATTEMPT_YEARS, LANGUAGE_MEDIUMS, STUDY_MODES, EXAM_PHASES, PREVIOUS_ATTEMPTS_OPTIONS, DAILY_STUDY_HOURS_OPTIONS, PREFERRED_STUDY_TIMES, PREFERRED_LEARNING_METHODS_PER_SUBJECT, MOTIVATION_TYPES, EXAM_SUBJECT_MAP, PREPARATION_LEVELS } from '@/lib/constants'; // Added PREPARATION_LEVELS
import { Separator } from '@/components/ui/separator';

interface Step5ReviewProps {
  formData: OnboardingFormData;
}

const findLabel = (options: { value: string, label: string }[] | { id: string, label: string }[], value: string | undefined) => {
  if (!value) return 'Not specified';
  const item = options.find(opt => ('value' in opt ? opt.value : opt.id) === value);
  return item ? item.label : value;
};

const findMultipleLabels = (options: { id: string, label: string }[], values: string[] | undefined) => {
  if (!values || values.length === 0) return 'Not specified';
  return values.map(val => findLabel(options, val)).join(', ');
};

export default function Step5Review({ formData }: Step5ReviewProps) {
  const getTargetExamLabels = () => {
    if (!formData.targetExams || formData.targetExams.length === 0) return 'Not specified';
    return formData.targetExams.map(examValue => {
      if (examValue === 'other' && formData.otherExamName) {
        return formData.otherExamName;
      }
      return findLabel(TARGET_EXAMS, examValue);
    }).join(', ');
  };

  const getSubjectName = (subjectId: string, selectedExam?: string): string => {
    if (selectedExam) {
        const examSubjects = EXAM_SUBJECT_MAP[selectedExam];
        if (examSubjects) {
            const subject = examSubjects.find(s => s.id === subjectId);
            if (subject) return subject.name;
        }
    }
    // Fallback for 'other' exam or if subjectId not in map
    if (subjectId.startsWith('custom_subject_')) {
        const index = parseInt(subjectId.replace('custom_subject_', ''), 10);
        return `Custom Subject ${index}`;
    }
    return subjectId; // Or a more generic lookup if you have one
  };


  return (
    <div className="space-y-4 md:space-y-6">
      <CardDescription className="text-center text-sm sm:text-base">
        Please review your information carefully before submitting. You can go back to previous steps to make changes.
      </CardDescription>
      
      <ScrollArea className="h-[450px] sm:h-[500px] rounded-md border p-3 sm:p-4 bg-muted/30 space-y-4">
        {/* Section 1: Personal & General Academic */}
        <ReviewSection title="Personal & Academic Basics">
          <ReviewItem label="Full Name" value={formData.fullName} />
          <ReviewItem label="Age" value={formData.age ? formData.age.toString() : 'Not specified'} />
          <ReviewItem label="Location" value={formData.location} />
          <ReviewItem label="Language Medium" value={findLabel(LANGUAGE_MEDIUMS, formData.languageMedium)} />
          <ReviewItem label="Study Mode" value={findLabel(STUDY_MODES, formData.studyMode)} />
          <ReviewItem label="Exam Phase" value={findLabel(EXAM_PHASES, formData.examPhase)} />
          <ReviewItem label="Previous Attempts" value={findLabel(PREVIOUS_ATTEMPTS_OPTIONS, formData.previousAttempts)} />
        </ReviewSection>
        
        <Separator />

        {/* Section 2: Exam Focus */}
        <ReviewSection title="Exam Focus">
          <ReviewItem label="Target Exam(s)" value={getTargetExamLabels()} />
          <ReviewItem label="Attempt Year" value={findLabel(EXAM_ATTEMPT_YEARS(), formData.examAttemptYear)} />
        </ReviewSection>
        
        <Separator />

        {/* Section 3: Subject Details */}
        <ReviewSection title="Subject Deep Dive">
          {formData.subjectDetails && formData.subjectDetails.length > 0 ? (
            formData.subjectDetails.map((subject, index) => (
              <Card key={index} className="mb-3 bg-card/70 p-2 sm:p-3">
                <p className="font-semibold text-sm text-primary mb-1">{subject.subjectName || getSubjectName(subject.subjectId, formData.targetExams?.[0])}</p>
                <ReviewItem label="Preparation Level" value={findLabel(PREPARATION_LEVELS, subject.preparationLevel)} textSize="text-xs" />
                <ReviewItem label="Target Score" value={subject.targetScore} textSize="text-xs" />
                <ReviewItem label="Learning Methods" value={findMultipleLabels(PREFERRED_LEARNING_METHODS_PER_SUBJECT, subject.preferredLearningMethods)} textSize="text-xs" />
              </Card>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No subject details provided.</p>
          )}
        </ReviewSection>

        <Separator />

        {/* Section 4: Study Habits & Preferences */}
        <ReviewSection title="Study Habits & Preferences">
          <ReviewItem label="Daily Study Hours" value={findLabel(DAILY_STUDY_HOURS_OPTIONS, formData.dailyStudyHours)} />
          <ReviewItem label="Preferred Study Time(s)" value={findMultipleLabels(PREFERRED_STUDY_TIMES, formData.preferredStudyTime)} />
          <ReviewItem label="Distraction Struggles" value={formData.distractionStruggles} />
          <ReviewItem label="Motivation Type" value={findLabel(MOTIVATION_TYPES, formData.motivationType)} />
          <ReviewItem label="Public Profile" value={formData.socialVisibilityPublic ? 'Yes' : 'No'} />
        </ReviewSection>

      </ScrollArea>
    </div>
  );
}

interface ReviewSectionProps {
  title: string;
  children: React.ReactNode;
}
const ReviewSection: React.FC<ReviewSectionProps> = ({ title, children }) => (
  <div className="py-2">
    <h3 className="text-md sm:text-lg font-semibold text-primary mb-2">{title}</h3>
    <div className="space-y-1.5 sm:space-y-2">{children}</div>
  </div>
);

interface ReviewItemProps {
  label: string;
  value?: string | number | null | string[];
  textSize?: string;
}
const ReviewItem: React.FC<ReviewItemProps> = ({ label, value, textSize = "text-sm" }) => {
  const displayValue = (Array.isArray(value) ? value.join(', ') : value) || 'Not specified';
  return (
    <div className={`grid grid-cols-1 xs:grid-cols-3 gap-1 ${textSize}`}>
      <span className="font-medium text-muted-foreground xs:col-span-1">{label}:</span>
      <span className="text-foreground xs:col-span-2 break-words">{displayValue}</span>
    </div>
  );
};
