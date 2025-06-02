
import type { LucideIcon } from 'lucide-react';
import { Music2, Waves, Leaf } from 'lucide-react';

// Definition for a single soundtrack
export interface SoundtrackDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
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
  price: 75,
  icon: Music2,
  category: 'Soundtrack',
  filePath: '/sounds/placeholder_lofi_1.mp3', // USER ACTION: Replace with actual file path
  colorClass: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300',
};

export const ambientFocusWaves: SoundtrackDefinition = {
  id: 'ambient_waves_1',
  name: 'Ambient Focus Waves',
  description: 'Calming ambient soundscapes with gentle wave sounds to minimize distractions.',
  price: 60,
  icon: Waves,
  category: 'Soundtrack',
  filePath: '/sounds/placeholder_ambient_1.mp3', // USER ACTION: Replace with actual file path
  colorClass: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-300',
};

export const natureSoundscape: SoundtrackDefinition = {
  id: 'nature_study_1',
  name: 'Forest Study Scape',
  description: 'Immersive nature sounds, like a gentle forest breeze and birdsong, for deep concentration.',
  price: 90,
  icon: Leaf,
  category: 'Soundtrack',
  filePath: '/sounds/placeholder_nature_1.mp3', // USER ACTION: Replace with actual file path
  colorClass: 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-300',
};


export const ALL_SOUNDTRACK_DEFINITIONS: SoundtrackDefinition[] = [
  lofiChillHop,
  ambientFocusWaves,
  natureSoundscape,
];
