
'use server';
/**
 * @fileOverview AI-powered WordQuest challenge generator.
 *
 * - generateWordQuestChallenge - Generates a word, clue, and relevant options/hint for WordQuest.
 * - GenerateWordQuestChallengeInput - Input type for the flow.
 * - WordQuestChallengeOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateWordQuestChallengeInputSchema,
  WordQuestChallengeOutputSchema,
  type GenerateWordQuestChallengeInput,
  type WordQuestChallengeOutput,
} from '@/ai/schemas/wordquest-ai-schemas'; // Ensure path is correct

export type { GenerateWordQuestChallengeInput, WordQuestChallengeOutput };

export async function generateWordQuestChallenge(input: GenerateWordQuestChallengeInput): Promise<WordQuestChallengeOutput> {
  return generateWordQuestChallengeFlow(input);
}

const generateChallengePrompt = ai.definePrompt({
  name: 'generateWordQuestChallengePrompt',
  input: { schema: GenerateWordQuestChallengeInputSchema },
  output: { schema: WordQuestChallengeOutputSchema },
  prompt: `You are an expert lexicographer and quiz master creating challenges for a word game called WordQuest.
Your goal is to generate ONE engaging and educational word challenge based on the specified game mode.

Game Mode: {{gameMode}}
{{#if previousWords.length}}
Previously used words in this session (try to avoid direct repetition if possible):
{{#each previousWords}}
- {{{this}}}
{{/each}}
{{/if}}

Specific Instructions Based on Game Mode:
1.  **Word Selection**:
    *   'basic': Choose a common to moderately common English word.
    *   'intermediate': Choose a moderately difficult English word.
    *   'advanced': Choose a difficult, less common, or nuanced English word.
    The word MUST be a single word (no phrases).

2.  **Clue Generation (clue & clueType)**:
    *   'basic': Provide a clear, concise 'definition' for the word.
    *   'intermediate': Provide either a 'definition' or a 'fill-in-the-blank' sentence where the blank represents the word. Example for fill-in-the-blank: "A ____ is a place where books are kept."
    *   'advanced': Provide a 'definition'. It can be slightly more challenging or require deeper understanding than intermediate.

3.  **Options Generation (options array - ONLY for 'basic' mode)**:
    *   If gameMode is 'basic', generate an array of 3 to 4 unique strings:
        *   One string MUST be the correct target 'word'.
        *   The other strings MUST be plausible but incorrect distractor words (single words, not phrases).
        *   Ensure options are distinct and make sense in the context of a vocabulary game.
    *   If gameMode is 'intermediate' or 'advanced', DO NOT provide the 'options' field (or provide an empty array).

4.  **Hint Generation (hint string - ONLY for 'intermediate' and 'advanced' modes)**:
    *   If gameMode is 'intermediate' or 'advanced', provide a short, helpful hint.
        *   Examples: "Starts with P", "Rhymes with rain", "Related to science", "A type of emotion".
        *   The hint should NOT give away the answer directly.
    *   If gameMode is 'basic', DO NOT provide the 'hint' field.

Ensure your output is a single JSON object strictly adhering to the WordQuestChallengeOutputSchema.

Example for 'basic' mode:
{
  "word": "Happy",
  "clue": "Feeling or showing pleasure or contentment.",
  "clueType": "definition",
  "options": ["Joyful", "Happy", "Glad", "Content"]
}

Example for 'intermediate' mode with definition:
{
  "word": "Elaborate",
  "clue": "To explain or describe something in a more detailed way.",
  "clueType": "definition",
  "hint": "Involves adding more detail"
}

Example for 'intermediate' mode with fill-in-the-blank:
{
  "word": "Library",
  "clue": "A ____ is a place where books and other materials are kept for reading or borrowing.",
  "clueType": "fill-in-the-blank",
  "hint": "Knowledge repository"
}

Example for 'advanced' mode:
{
  "word": "Ephemeral",
  "clue": "Lasting for a very short time; transient.",
  "clueType": "definition",
  "hint": "Think 'fleeting'"
}

Now, generate the word challenge.
`,
});

const generateWordQuestChallengeFlow = ai.defineFlow(
  {
    name: 'generateWordQuestChallengeFlow',
    inputSchema: GenerateWordQuestChallengeInputSchema,
    outputSchema: WordQuestChallengeOutputSchema,
  },
  async (input) => {
    const { output } = await generateChallengePrompt(input);
    if (!output) {
      throw new Error('The AI model did not return a valid word challenge. Please try again.');
    }

    // Validate 'options' presence for 'basic' mode
    if (input.gameMode === 'basic' && (!output.options || output.options.length < 3)) {
      console.warn("AI didn't provide enough options for basic mode. Output:", output);
      // Attempt to fallback or throw a more specific error. For now, let it pass but log.
      // throw new Error("AI failed to generate sufficient options for basic mode.");
    }
    // Validate 'hint' presence for 'intermediate'/'advanced'
    if ((input.gameMode === 'intermediate' || input.gameMode === 'advanced') && !output.hint) {
       console.warn(`AI didn't provide a hint for ${input.gameMode} mode. Output:`, output);
       // output.hint = "No hint available."; // Or provide a default
    }

    // Ensure 'word' is always a single word (basic check)
    if (output.word.includes(" ")) {
        console.warn(`AI generated a multi-word 'word': "${output.word}". Attempting to pick first word.`);
        output.word = output.word.split(" ")[0];
    }
    if (output.options) {
        output.options = output.options.map(opt => opt.includes(" ") ? opt.split(" ")[0] : opt);
        if (input.gameMode === 'basic' && !output.options.includes(output.word)) {
            console.warn(`AI generated options for basic mode but did not include the correct word "${output.word}" in options: ${output.options}. Adding it.`);
            output.options.pop(); // Remove last option to make space
            output.options.push(output.word); // Add correct word
            // Shuffle options client-side anyway, so order doesn't matter here.
        }
    }


    return output;
  }
);
