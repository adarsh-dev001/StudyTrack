
'use server';
/**
 * @fileOverview AI-powered WordQuest challenge session generator.
 *
 * - generateWordQuestSession - Generates a set of words, clues, and relevant options/hints for a WordQuest session.
 * - GenerateWordQuestSessionInput - Input type for the flow.
 * - WordQuestSessionOutput - Output type for the flow, containing an array of challenges.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateWordQuestSessionInputSchema,
  WordQuestSessionOutputSchema,
  SingleWordQuestChallengeSchema, 
  type GenerateWordQuestSessionInput,
  type WordQuestSessionOutput,
} from '@/ai/schemas/wordquest-ai-schemas';

export type { GenerateWordQuestSessionInput, WordQuestSessionOutput };

export async function generateWordQuestSession(input: GenerateWordQuestSessionInput): Promise<WordQuestSessionOutput> {
  return generateWordQuestSessionFlow(input);
}

const generateSessionPrompt = ai.definePrompt({
  name: 'generateWordQuestSessionPrompt',
  input: { schema: GenerateWordQuestSessionInputSchema },
  output: { schema: WordQuestSessionOutputSchema }, 
  prompt: `You are an expert lexicographer and quiz master creating challenges for a word game called WordQuest.
Your goal is to generate a set of {{numChallenges}} unique and engaging word challenges based on the specified game mode. Ensure each challenge is distinct within this session.

Game Mode: {{gameMode}}
Number of Challenges to Generate: {{numChallenges}}
{{#if previousWords.length}}
Previously used words in other sessions (try to avoid direct repetition if possible, but prioritize quality and uniqueness within THIS session):
{{#each previousWords}}
- {{{this}}}
{{/each}}
{{/if}}

For EACH of the {{numChallenges}} challenges, adhere to the following:
1.  **Word Selection**:
    *   'basic': Choose a common to moderately common English word.
    *   'intermediate': Choose a moderately difficult English word.
    *   'advanced': Choose a difficult, less common, or nuanced English word.
    The word MUST be a single word (no phrases). Ensure the word is non-empty.

2.  **Clue Generation (clue & clueType)**:
    *   Provide a non-empty 'clue' for the word.
    *   'basic': The 'clueType' should be 'definition'. The 'clue' should be a clear, concise definition.
    *   'intermediate': The 'clueType' can be 'definition' or 'fill-in-the-blank'. For 'fill-in-the-blank', the clue should be a sentence where the blank represents the word (e.g., "A ____ is a place where books are kept.").
    *   'advanced': The 'clueType' should be 'definition'. It can be slightly more challenging.

3.  **Options Generation (options array - ONLY for 'basic' mode for each challenge)**:
    *   If gameMode is 'basic', generate an array of 3 to 4 unique strings for 'options':
        *   One string MUST be the correct target 'word'.
        *   The other strings MUST be plausible but incorrect distractor words (single words, not phrases).
        *   Distractors should be somewhat related (e.g., category, sound) but clearly incorrect. Avoid direct synonyms or antonyms as distractors.
        *   Ensure all options are distinct and single words.
    *   If gameMode is 'intermediate' or 'advanced', DO NOT provide the 'options' field or provide an empty array.

4.  **Hint Generation (hint string - ONLY for 'intermediate' and 'advanced' modes for each challenge)**:
    *   If gameMode is 'intermediate' or 'advanced', provide a short, helpful 'hint' (e.g., "Starts with P", "Rhymes with rain", "Related to science"). The hint should NOT directly give away the answer.
    *   If gameMode is 'basic', DO NOT provide the 'hint' field.

Ensure your output is a single JSON object strictly adhering to the WordQuestSessionOutputSchema.
The output JSON should have a "challenges" field, which is an array of challenge objects.
Each challenge object must contain: 'word' (string), 'clue' (string), 'clueType' (enum: 'definition' | 'fill-in-the-blank').
Conditionally, it must contain 'options' (array of strings, for basic mode) or 'hint' (string, for intermediate/advanced).

Example for a single 'basic' challenge:
{
  "word": "Happy",
  "clue": "Feeling or showing pleasure or contentment.",
  "clueType": "definition",
  "options": ["Joyful", "Happy", "Glad", "Content"]
}
Example for a single 'intermediate' challenge:
{
  "word": "Serendipity",
  "clue": "The occurrence of events by chance in a happy or beneficial way.",
  "clueType": "definition",
  "hint": "Starts with S, relates to fortunate discoveries."
}

Now, generate the set of {{numChallenges}} word challenges.
`,
});

const generateWordQuestSessionFlow = ai.defineFlow(
  {
    name: 'generateWordQuestSessionFlow',
    inputSchema: GenerateWordQuestSessionInputSchema,
    outputSchema: WordQuestSessionOutputSchema,
  },
  async (input) => {
    const effectiveInput = { ...input, numChallenges: input.numChallenges || 3 };
    const { output } = await generateSessionPrompt(effectiveInput);
    
    if (!output || !output.challenges || output.challenges.length === 0) {
      throw new Error('The AI model did not return a valid set of word challenges. Please try again.');
    }
    if (output.challenges.length < effectiveInput.numChallenges) {
        console.warn(`AI returned ${output.challenges.length} challenges, but ${effectiveInput.numChallenges} were requested.`);
    }

    output.challenges.forEach((challenge, index) => {
      // Validate and clean word
      if (!challenge.word || challenge.word.trim() === "") {
        console.warn(`Challenge ${index + 1} has an empty word. Setting to 'DefaultWord'.`);
        challenge.word = `DefaultWord${index+1}`;
      } else if (challenge.word.includes(" ")) {
          console.warn(`Challenge ${index + 1} ('${challenge.word}') has a multi-word 'word'. Attempting to pick first word.`);
          challenge.word = challenge.word.split(" ")[0];
      }

      // Ensure clue is present and clueType is valid
      if (!challenge.clue || challenge.clue.trim() === "") {
          console.warn(`Challenge ${index + 1} ('${challenge.word}') is missing a clue. Providing default.`);
          challenge.clue = `What is the definition or context for "${challenge.word}"?`;
      }
      if (!challenge.clueType || (challenge.clueType !== 'definition' && challenge.clueType !== 'fill-in-the-blank')) {
          console.warn(`Challenge ${index + 1} ('${challenge.word}') has invalid clueType '${challenge.clueType}'. Defaulting to 'definition'.`);
          challenge.clueType = 'definition';
      }


      if (input.gameMode === 'basic') {
        challenge.options = challenge.options || []; // Ensure options array exists
        challenge.options = challenge.options.map(opt => opt.includes(" ") ? opt.split(" ")[0] : opt); // Ensure single words

        if (!challenge.options.includes(challenge.word)) {
          console.warn(`Challenge ${index + 1} ('${challenge.word}') for basic mode options did not include the correct word. Adding it.`);
          if (challenge.options.length >= 4) { // Max 4 options, replace one if full
            challenge.options.pop(); 
          }
          challenge.options.push(challenge.word);
        }
        
        // Ensure at least 3 options by adding unique placeholders
        let placeholderAttempt = 0;
        while (challenge.options.length < 3 && placeholderAttempt < 10) {
          let placeholder = `Choice${challenge.options.length + 1 + placeholderAttempt}`;
          if (!challenge.options.includes(placeholder) && placeholder !== challenge.word) {
            challenge.options.push(placeholder);
          }
          placeholderAttempt++;
        }
        if (challenge.options.length < 3) {
            console.error(`Failed to create enough unique options for basic mode challenge: ${challenge.word}`);
            // Throw error or handle as critical failure
        }
        
        challenge.options = challenge.options.slice(0, 4); // Ensure max 4 options
        challenge.hint = undefined; // Basic mode should not have hints

      } else { // Intermediate or Advanced
        if (challenge.options && challenge.options.length > 0) {
            console.warn(`Challenge ${index + 1} ('${challenge.word}') for ${input.gameMode} mode unexpectedly has options. Clearing them.`);
            challenge.options = [];
        }
        if (!challenge.hint || challenge.hint.trim() === "") {
           console.warn(`Challenge ${index + 1} ('${challenge.word}') for ${input.gameMode} mode is missing a hint. Providing a default.`);
           challenge.hint = "Think carefully!"; 
        }
      }
    });
    
    // Filter out challenges that might still be malformed after trying to fix (e.g., empty word from AI)
    output.challenges = output.challenges.filter(c => c.word && c.word.trim() !== "" && c.clue && c.clue.trim() !== "");
    if (output.challenges.length === 0) {
        throw new Error('AI generated challenges, but all were invalid after processing.');
    }

    return output;
  }
);

