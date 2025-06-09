
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
  SingleWordQuestChallengeSchema, // We'll use this internally for prompt structure
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
  output: { schema: WordQuestSessionOutputSchema }, // Output is now a session with multiple challenges
  prompt: `You are an expert lexicographer and quiz master creating challenges for a word game called WordQuest.
Your goal is to generate a set of {{numChallenges}} unique and engaging word challenges based on the specified game mode.

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
    The word MUST be a single word (no phrases). Ensure words are unique within this generated set.

2.  **Clue Generation (clue & clueType)**:
    *   'basic': Provide a clear, concise 'definition' for the word.
    *   'intermediate': Provide either a 'definition' or a 'fill-in-the-blank' sentence where the blank represents the word. Example for fill-in-the-blank: "A ____ is a place where books are kept."
    *   'advanced': Provide a 'definition'. It can be slightly more challenging or require deeper understanding than intermediate.

3.  **Options Generation (options array - ONLY for 'basic' mode for each challenge)**:
    *   If gameMode is 'basic', generate an array of 3 to 4 unique strings:
        *   One string MUST be the correct target 'word'.
        *   The other strings MUST be plausible but incorrect distractor words (single words, not phrases).
        *   For distractor options, choose words that are related in category or sound but are clearly incorrect. Avoid direct synonyms or antonyms of the target word.
        *   Ensure options are distinct and make sense in the context of a vocabulary game.
    *   If gameMode is 'intermediate' or 'advanced', DO NOT provide the 'options' field (or provide an empty array) for that challenge.

4.  **Hint Generation (hint string - ONLY for 'intermediate' and 'advanced' modes for each challenge)**:
    *   If gameMode is 'intermediate' or 'advanced', provide a short, helpful hint.
        *   Examples: "Starts with P", "Rhymes with rain", "Related to science", "A type of emotion".
        *   The hint should NOT give away the answer directly.
    *   If gameMode is 'basic', DO NOT provide the 'hint' field for that challenge.

Ensure your output is a single JSON object strictly adhering to the WordQuestSessionOutputSchema.
The output JSON should have a "challenges" field, which is an array of challenge objects.
Each challenge object in the array must conform to: word, clue, clueType, and conditionally options or hint.

Example for a single challenge object within the 'challenges' array (if gameMode was 'basic'):
{
  "word": "Happy",
  "clue": "Feeling or showing pleasure or contentment.",
  "clueType": "definition",
  "options": ["Joyful", "Happy", "Glad", "Content"]
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
    // Ensure numChallenges has a default if not provided by input, though schema does this.
    const effectiveInput = { ...input, numChallenges: input.numChallenges || 3 }; // Using 3 from schema default
    const { output } = await generateSessionPrompt(effectiveInput);
    
    if (!output || !output.challenges || output.challenges.length === 0) {
      throw new Error('The AI model did not return a valid set of word challenges. Please try again.');
    }
    if (output.challenges.length < effectiveInput.numChallenges) {
        console.warn(`AI returned ${output.challenges.length} challenges, but ${effectiveInput.numChallenges} were requested.`);
        // Decide if this is an error or acceptable. For now, proceed with what was returned.
    }

    // Validate each challenge
    output.challenges.forEach((challenge, index) => {
      if (input.gameMode === 'basic' && (!challenge.options || challenge.options.length < 3)) {
        console.warn(`Challenge ${index + 1} ('${challenge.word}') for basic mode has insufficient options.`);
        // Consider correcting or removing the challenge, or throwing an error
      }
      if ((input.gameMode === 'intermediate' || input.gameMode === 'advanced') && !challenge.hint) {
         console.warn(`Challenge ${index + 1} ('${challenge.word}') for ${input.gameMode} mode is missing a hint.`);
         // challenge.hint = "No hint available."; // Or provide a default
      }
      if (challenge.word.includes(" ")) {
          console.warn(`Challenge ${index + 1} has a multi-word 'word': "${challenge.word}". Attempting to pick first word.`);
          challenge.word = challenge.word.split(" ")[0];
      }
      if (challenge.options) {
          challenge.options = challenge.options.map(opt => opt.includes(" ") ? opt.split(" ")[0] : opt);
          if (input.gameMode === 'basic' && !challenge.options.includes(challenge.word)) {
              console.warn(`Challenge ${index + 1} ('${challenge.word}') for basic mode did not include the correct word in options. Adding it.`);
              if (challenge.options.length > 0) {
                  challenge.options.pop(); 
              }
              challenge.options.push(challenge.word);
              // Ensure there are enough options after correction
              while (challenge.options.length < 3) {
                challenge.options.push(`Placeholder${Math.random().toString(36).substring(7)}`); // Add unique placeholder
              }
          }
      }
    });

    return output;
  }
);

