
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai-plugin'; // Comment out or remove if package is removed

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai() // Comment out or remove if package is removed
  ],
  model: 'googleai/gemini-2.0-flash', 
});
