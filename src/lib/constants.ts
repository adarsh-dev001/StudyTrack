
export const TARGET_EXAMS = [
  { value: 'jee', label: 'JEE (Engineering)' },
  { value: 'neet', label: 'NEET (Medical)' },
  { value: 'upsc', label: 'UPSC (Civil Services)' },
  { value: 'cat', label: 'CAT (MBA Entrance)' },
  { value: 'bank_exams', label: 'Bank Exams (PO, Clerk)' },
  { value: 'ssc', label: 'SSC Exams (CGL, CHSL)' },
  { value: 'psc', label: 'PSC (State Level)' },
  { value: 'other', label: 'Other' },
];

export const EXAM_ATTEMPT_YEARS = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push({ value: (currentYear + i).toString(), label: (currentYear + i).toString() });
  }
  return years;
};

export const LANGUAGE_MEDIUMS = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'regional', label: 'Regional Language' },
  { value: 'other', label: 'Other' },
];

export const DAILY_STUDY_HOURS_OPTIONS = [
  { value: '1-2', label: '1-2 hours' },
  { value: '2-4', label: '2-4 hours' },
  { value: '4-6', label: '4-6 hours' },
  { value: '6-8', label: '6-8 hours' },
  { value: '8+', label: '8+ hours' },
];

export const PREFERRED_STUDY_TIMES = [
  { id: 'morning', label: 'Morning (6 AM - 12 PM)' },
  { id: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
  { id: 'evening', label: 'Evening (5 PM - 9 PM)' },
  { id: 'night', label: 'Night (9 PM - 1 AM)' },
  { id: 'flexible', label: 'Flexible' },
];

export const SUBJECT_OPTIONS = [
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'mathematics', label: 'Mathematics' },
  { id: 'history', label: 'History' },
  { id: 'geography', label: 'Geography' },
  { id: 'polity', label: 'Polity' },
  { id: 'economy', label: 'Economy' },
  { id: 'general_science', label: 'General Science' },
  { id: 'english', label: 'English' },
  { id: 'current_affairs', label: 'Current Affairs' },
  { id: 'other', label: 'Other Subject' }
];


export const PREFERRED_LEARNING_STYLES = [
  { id: 'videos', label: 'Watching Videos' },
  { id: 'notes', label: 'Reading Notes/Textbooks' },
  { id: 'mcqs', label: 'Solving MCQs/Quizzes' },
  { id: 'interactive', label: 'Interactive Exercises' },
  { id: 'discussions', label: 'Group Discussions' },
];

export const MOTIVATION_TYPES = [
  { value: 'xp_badges', label: 'Earning XP & Badges' },
  { value: 'leaderboard', label: 'Climbing the Leaderboard' },
  { value: 'personal_goals', label: 'Achieving Personal Goals' },
  { value: 'calm_mode', label: 'Calm, Focused Environment' },
];

export const STUDY_MODES = [
  { value: 'self_study', label: 'Self-Study' },
  { value: 'coaching', label: 'Coaching Classes' },
  { value: 'hybrid', label: 'Hybrid (Self-Study + Coaching)' },
];

export const EXAM_PHASES = [
  { value: 'not_started', label: 'Not Started Yet' },
  { value: 'prelims', label: 'Preparing for Prelims' },
  { value: 'mains', label: 'Preparing for Mains' },
  { value: 'interview', label: 'Preparing for Interview' },
  { value: 'completed_cycle', label: 'Completed a Full Cycle / Repeating' },
];

export const PREVIOUS_ATTEMPTS_OPTIONS = [
  { value: '0', label: '0 (First Attempt)' },
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5+', label: '5+' },
];
