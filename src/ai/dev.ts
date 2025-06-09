
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-study-material.ts';
import '@/ai/flows/analyze-productivity-data.ts';
import '@/ai/flows/suggest-study-topics.ts';
import '@/ai/flows/generate-personalized-recommendations.ts'; 
import '@/ai/flows/generate-quiz-flow.ts'; // Added new quiz flow
import '@/ai/flows/solve-academic-doubt-flow.ts'; // Added new doubt solver flow
import '@/ai/flows/process-youtube-video-flow.ts'; // Added YouTube processor flow
import '@/ai/flows/generate-wordquest-challenge-flow.ts'; // WordQuest AI flow (now generates a session)

    
