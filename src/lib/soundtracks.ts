
import type { LucideIcon } from 'lucide-react';
import { Music2, Waves, Leaf, Headphones } from 'lucide-react'; // Added Headphones

// Definition for a single soundtrack
export interface SoundtrackDefinition {
  id: string;
  name: string;
  description: string;
  price: number; // Price in coins, though currently all are free in the shop
  icon: LucideIcon;
  category: 'Soundtrack';
  filePath: string; // Path within the public folder, e.g., /sounds/lofi_chill_1.mp3
  colorClass?: string; // Optional: for styling in the shop
}

// Example Soundtracks
// IMPORTANT: Replace filePath with actual paths to your audio files in the public/sounds/ directory.
export const lofiChillHop: SoundtrackDefinition = {
  id: 'lofi_chill_1',
  name: 'Lofi Chill Beats Vol. 1',
  description: 'Smooth lo-fi hip hop beats to keep you focused and relaxed. Perfect for long study sessions.',
  price: 0, // All soundtracks are currently free
  icon: Music2,
  category: 'Soundtrack',
  filePath: '/sounds/your_lofi_track.mp3', // UPDATED: Example path for you to replace
  colorClass: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300',
};

export const ambientFocusWaves: SoundtrackDefinition = {
  id: 'ambient_waves_1',
  name: 'Ambient Focus Waves',
  description: 'Calming ambient soundscapes with gentle wave sounds to minimize distractions.',
  price: 0, // All soundtracks are currently free
  icon: Waves,
  category: 'Soundtrack',
  filePath: '/sounds/placeholder_ambient_1.mp3', // USER ACTION: Replace with actual file path
  colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-300',
};

export const natureSoundscape: SoundtrackDefinition = {
  id: 'nature_study_1',
  name: 'Forest Study Scape',
  description: 'Immersive nature sounds, like a gentle forest breeze and birdsong, for deep concentration.',
  price: 0, // All soundtracks are currently free
  icon: Leaf,
  category: 'Soundtrack',
  filePath: '/sounds/placeholder_nature_1.mp3', // USER ACTION: Replace with actual file path
  colorClass: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-300',
};

// NEW EXAMPLE SOUNDTRACK
export const zenFocusMix: SoundtrackDefinition = {
  id: 'zen_focus_mix_1',
  name: 'Zen Focus Mix',
  description: 'Minimalist ambient tones designed for deep work and meditation during study.',
  price: 0, // All soundtracks are currently free
  icon: Headphones,
  category: 'Soundtrack',
  filePath: '/sounds/your_zen_track.mp3', // USER ACTION: Replace with your actual file path
  colorClass: 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-300',
};


export const ALL_SOUNDTRACK_DEFINITIONS: SoundtrackDefinition[] = [
  lofiChillHop,
  ambientFocusWaves,
  natureSoundscape,
  zenFocusMix, // Added the new example here
];

// Ensure ThemeDefinition type is also exported if it's used elsewhere from this module.
// If ThemeDefinition is only used internally in this file, this export is not strictly necessary
// for resolving the "module not found" error but is good practice if other files might import the type.
// export type { ThemeDefinition }; // This line seems to be a leftover from a themes file, removing.
