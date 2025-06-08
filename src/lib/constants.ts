
export const TARGET_EXAMS = [
  { value: 'jee', label: 'JEE (Engineering)' },
  { value: 'neet', label: 'NEET (Medical)' },
  { value: 'upsc', label: 'UPSC (Civil Services)' },
  { value: 'cat', label: 'CAT (MBA Entrance)' },
  { value: 'bank_exams', label: 'Bank Exams (PO, Clerk)' },
  { value: 'ssc', label: 'SSC Exams (CGL, CHSL)' },
  { value: 'class_10_boards', label: 'Class 10 Boards' },
  { value: 'class_12_boards', label: 'Class 12 Boards' },
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
  upsc: [
    { id: 'polity', name: 'Polity' },
    { id: 'geography', name: 'Geography' },
    { id: 'economy', name: 'Economy' },
    { id: 'history', name: 'History' },
    { id: 'current_affairs', name: 'Current Affairs' },
    { id: 'ethics_integrity_aptitude', name: 'Ethics, Integrity & Aptitude' },
    { id: 'essay', name: 'Essay' },
    { id: 'optional_subject_1', name: 'Optional Subject 1' },
    { id: 'optional_subject_2', name: 'Optional Subject 2' },
    { id: 'general_science_tech', name: 'General Science & Tech' },
    { id: 'environment_ecology', name: 'Environment & Ecology' },
  ],
  ssc: [
    { id: 'general_intelligence_reasoning', name: 'General Intelligence & Reasoning' },
    { id: 'quantitative_aptitude', name: 'Quantitative Aptitude' },
    { id: 'english_language_comprehension', name: 'English Language & Comprehension' },
    { id: 'general_awareness', name: 'General Awareness' },
  ],
  cat: [
    { id: 'quantitative_ability', name: 'Quantitative Ability (QA)' },
    { id: 'verbal_ability_reading_comprehension', name: 'Verbal Ability & Reading Comprehension (VARC)' },
    { id: 'data_interpretation_logical_reasoning', name: 'Data Interpretation & Logical Reasoning (DILR)' },
  ],
  bank_exams: [
    { id: 'reasoning_ability', name: 'Reasoning Ability' },
    { id: 'quantitative_aptitude_banking', name: 'Quantitative Aptitude (Banking)' },
    { id: 'english_language_banking', name: 'English Language (Banking)' },
    { id: 'general_financial_awareness', name: 'General/Financial Awareness' },
    { id: 'computer_aptitude', name: 'Computer Aptitude' },
  ],
  class_10_boards: [
    { id: 'mathematics_10', name: 'Mathematics (Class 10)' },
    { id: 'science_10', name: 'Science (Physics, Chemistry, Biology - Class 10)' },
    { id: 'social_science_10', name: 'Social Science (History, Geography, Civics, Economics - Class 10)' },
    { id: 'english_10', name: 'English (Class 10)' },
    { id: 'second_language_10', name: 'Second Language (e.g., Hindi, Regional - Class 10)' },
  ],
  class_12_boards: [ // Example, can be more specific by stream
    { id: 'physics_12', name: 'Physics (Class 12)' },
    { id: 'chemistry_12', name: 'Chemistry (Class 12)' },
    { id: 'mathematics_12', name: 'Mathematics (Class 12)' },
    { id: 'biology_12', name: 'Biology (Class 12)' },
    { id: 'english_12', name: 'English (Class 12)' },
    { id: 'accountancy_12', name: 'Accountancy (Class 12)' },
    { id: 'business_studies_12', name: 'Business Studies (Class 12)' },
    { id: 'economics_12', name: 'Economics (Class 12)' },
    { id: 'history_12', name: 'History (Class 12)' },
    { id: 'political_science_12', name: 'Political Science (Class 12)' },
    { id: 'geography_12', name: 'Geography (Class 12)' },
    { id: 'computer_science_12', name: 'Computer Science (Class 12)' },
  ],
  psc: [ 
    { id: 'general_studies_state', name: 'General Studies (State Specific)' },
    { id: 'aptitude_reasoning_psc', name: 'Aptitude & Reasoning (PSC)' },
    { id: 'regional_language_psc', name: 'Regional Language Paper (PSC)' },
    { id: 'state_specific_gk', name: 'State Specific GK' },
  ],
  other: [ 
    { id: 'core_subject_1', name: 'Core Subject 1' },
    { id: 'core_subject_2', name: 'Core Subject 2' },
    { id: 'elective_subject_1', name: 'Elective Subject 1' },
    { id: 'general_aptitude', name: 'General Aptitude/Reasoning' },
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
export const SUBJECT_OPTIONS = Object.values(EXAM_SUBJECT_MAP)
    .flat()
    .reduce((acc, subject) => {
        if (!acc.find(s => s.id === subject.id)) {
            acc.push(subject);
        }
        return acc;
    }, [] as {id: string, name: string}[])
    .sort((a,b) => a.name.localeCompare(b.name));


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

    