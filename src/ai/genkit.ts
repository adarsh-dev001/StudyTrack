
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openai} from '@genkit-ai/openai-plugin'; // Import the OpenAI plugin with correct name

export const ai = genkit({
  plugins: [
    googleAI(),
    openai() // Add the OpenAI plugin here
  ],
  model: 'googleai/gemini-2.0-flash', // Default model remains Gemini, but can be overridden in flows
});
