
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

export const EXAM_SUBJECT_MAP: Record<string, { id: string, name: string }[]> = {
  jee: [
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
  ],
  neet: [
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'biology', name: 'Biology (Botany & Zoology)' },
  ],
  upsc: [ // Example subjects, can be more comprehensive
    { id: 'history', name: 'History' },
    { id: 'geography', name: 'Geography' },
    { id: 'polity', name: 'Polity' },
    { id: 'economy', name: 'Economy' },
    { id: 'current_affairs', name: 'Current Affairs' },
    { id: 'optional_subject_1', name: 'Optional Subject 1' },
    { id: 'optional_subject_2', name: 'Optional Subject 2' },
  ],
  cat: [ // Example subjects
    { id: 'quantitative_aptitude', name: 'Quantitative Aptitude' },
    { id: 'verbal_ability', name: 'Verbal Ability & Reading Comprehension' },
    { id: 'data_interpretation', name: 'Data Interpretation & Logical Reasoning' },
  ],
  bank_exams: [
    { id: 'reasoning_ability', name: 'Reasoning Ability' },
    { id: 'quantitative_aptitude', name: 'Quantitative Aptitude' },
    { id: 'english_language', name: 'English Language' },
    { id: 'general_awareness', name: 'General/Financial Awareness' },
  ],
  ssc: [
    { id: 'general_intelligence', name: 'General Intelligence & Reasoning' },
    { id: 'quantitative_aptitude', name: 'Quantitative Aptitude' },
    { id: 'english_comprehension', name: 'English Comprehension' },
    { id: 'general_awareness', name: 'General Awareness' },
  ],
  psc: [ // Generic, often varies by state
    { id: 'general_studies_state', name: 'General Studies (State Specific)' },
    { id: 'aptitude_reasoning', name: 'Aptitude & Reasoning' },
    { id: 'regional_language', name: 'Regional Language Paper' },
  ],
  other: [ // For 'Other' exam type, allow manual input or generic subjects
    { id: 'custom_subject_1', name: 'Custom Subject 1' },
    { id: 'custom_subject_2', name: 'Custom Subject 2' },
    { id: 'custom_subject_3', name: 'Custom Subject 3' },
  ],
};

export const PREPARATION_LEVELS = [
  { value: 'beginner', label: 'Beginner (Just Started)' },
  { value: 'intermediate', label: 'Intermediate (Covered Basics)' },
  { value: 'advanced', label: 'Advanced (Syllabus Covered, Revising)' },
  { value: 'expert', label: 'Expert (Mock Tests & Refinement)' },
];

export const PREFERRED_LEARNING_METHODS_PER_SUBJECT = [
  { id: 'videos', label: 'Video Lectures' },
  { id: 'textbooks', label: 'Textbooks/Notes' },
  { id: 'practice_problems', label: 'Practice Problems/MCQs' },
  { id: 'interactive_simulations', label: 'Interactive Simulations' },
  { id: 'discussion_groups', label: 'Discussion Groups' },
  { id: 'past_papers', label: 'Solving Past Papers' },
  { id: 'mind_maps', label: 'Mind Maps/Flashcards' },
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
  { id: 'flexible', label: 'Flexible (Any time)' },
];

// General subject options, might be used if not dynamically loading based on exam.
// For the new form, EXAM_SUBJECT_MAP is more relevant for dynamic subjects.
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
  { id: 'visual', label: 'Visual (Diagrams, Videos)' },
  { id: 'auditory', label: 'Auditory (Lectures, Discussions)' },
  { id: 'reading_writing', label: 'Reading/Writing (Notes, Textbooks)' },
  { id: 'kinesthetic', label: 'Kinesthetic (Practice, Hands-on)' },
  { id: 'solitary', label: 'Solitary (Studying Alone)' },
  { id: 'social', label: 'Social (Group Study)' },
];


export const MOTIVATION_TYPES = [
  { value: 'xp_badges', label: 'Earning XP & Badges' },
  { value: 'leaderboard', label: 'Climbing the Leaderboard' },
  { value: 'personal_goals', label: 'Achieving Personal Goals' },
  { value: 'calm_mode', label: 'Calm, Focused Environment' },
  { value: 'peer_competition', label: 'Healthy Peer Competition'},
  { value: 'knowledge_mastery', label: 'Mastery of Subjects'},
];

export const STUDY_MODES = [
  { value: 'self_study', label: 'Self-Study' },
  { value: 'coaching', label: 'Coaching Classes' },
  { value: 'hybrid', label: 'Hybrid (Self-Study + Coaching)' },
  { value: 'online_courses', label: 'Online Courses/Platforms'},
];

export const EXAM_PHASES = [
  { value: 'not_started', label: 'Not Started Yet / Foundation Building' },
  { value: 'syllabus_coverage', label: 'Actively Covering Syllabus' },
  { value: 'revision_phase', label: 'Revision Phase' },
  { value: 'mock_tests', label: 'Mock Tests & Practice' },
  { value: 'final_touch', label: 'Final Touch & Strategy Refinement' },
];

export const PREVIOUS_ATTEMPTS_OPTIONS = [
  { value: '0', label: '0 (This is my first attempt)' },
  { value: '1', label: '1 Previous Attempt' },
  { value: '2', label: '2 Previous Attempts' },
  { value: '3', label: '3 Previous Attempts' },
  { value: '4+', label: '4 or More Previous Attempts' },
];
