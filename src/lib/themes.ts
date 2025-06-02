
import type { LucideIcon } from 'lucide-react';
import { Palette, Moon, Sun } from 'lucide-react';

// Definition for a single theme
export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: LucideIcon;
  category: 'Theme';
  colorClass?: string; // For the shop card display, can be derived or set
  themeDetails: {
    // CSS HSL string values
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    // Sidebar specific colors (if themes should affect them)
    sidebarBackground?: string;
    sidebarForeground?: string;
    sidebarPrimary?: string;
    sidebarPrimaryForeground?: string;
    sidebarAccent?: string;
    sidebarAccentForeground?: string;
    sidebarBorder?: string;
    sidebarRing?: string;
    // Chart colors (optional, could fall back to defaults if not specified)
    chart1?: string;
    chart2?: string;
    chart3?: string;
    chart4?: string;
    chart5?: string;
  };
}

// DEFAULT THEME (matches globals.css light mode as a baseline)
export const defaultLightTheme: ThemeDefinition = {
  id: 'default_light_theme',
  name: 'Default Light',
  description: 'The standard light theme for StudyTrack.',
  price: 0, // Not for sale
  icon: Sun,
  category: 'Theme',
  colorClass: 'bg-slate-100 border-slate-300 text-slate-700',
  themeDetails: {
    background: "210 20% 96.1%", // Light Gray #F5F7FA
    foreground: "0 0% 3.9%",     // Dark Gray/Black
    card: "0 0% 100%",            // White
    cardForeground: "0 0% 3.9%",
    popover: "0 0% 100%",
    popoverForeground: "0 0% 3.9%",
    primary: "200 95% 74.5%",    // Sky Blue #7DD3FC
    primaryForeground: "0 0% 3.9%",
    secondary: "210 20% 90%",
    secondaryForeground: "0 0% 9%",
    muted: "210 20% 92%",
    mutedForeground: "0 0% 45.1%",
    accent: "26 95% 53.1%",      // Orange #F97316
    accentForeground: "0 0% 98%",
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "0 0% 98%",
    border: "210 20% 85%",
    input: "0 0% 100%",
    ring: "200 95% 74.5%",
  }
};

// Example Theme 1: Crimson Dark
export const crimsonDarkTheme: ThemeDefinition = {
  id: 'crimson_dark_theme',
  name: 'Crimson Dark',
  description: 'A sleek dark theme with crimson accents.',
  price: 150,
  icon: Moon,
  category: 'Theme',
  colorClass: 'bg-red-800/10 border-red-800/30 text-red-300',
  themeDetails: {
    background: "0 0% 8%", // Very dark gray
    foreground: "0 0% 90%", // Light gray
    card: "0 0% 12%",
    cardForeground: "0 0% 90%",
    popover: "0 0% 10%",
    popoverForeground: "0 0% 90%",
    primary: "348 83% 47%", // Crimson
    primaryForeground: "0 0% 98%",
    secondary: "0 0% 15%",
    secondaryForeground: "0 0% 80%",
    muted: "0 0% 20%",
    mutedForeground: "0 0% 60%",
    accent: "348 83% 57%", // Brighter Crimson for accents
    accentForeground: "0 0% 98%",
    destructive: "0 70% 50%",
    destructiveForeground: "0 0% 98%",
    border: "0 0% 25%",
    input: "0 0% 15%",
    ring: "348 83% 47%",
    sidebarBackground: "0 0% 5%",
    sidebarForeground: "0 0% 85%",
  }
};

// Example Theme 2: Ocean Blue
export const oceanBlueTheme: ThemeDefinition = {
  id: 'ocean_blue_theme',
  name: 'Ocean Blue',
  description: 'A refreshing light theme with deep blue and teal accents.',
  price: 120,
  icon: Palette,
  category: 'Theme',
  colorClass: 'bg-sky-600/10 border-sky-600/30 text-sky-300',
  themeDetails: {
    background: "205 50% 95%", // Very light blue-gray
    foreground: "215 30% 25%", // Dark desaturated blue
    card: "0 0% 100%",
    cardForeground: "215 30% 25%",
    popover: "0 0% 100%",
    popoverForeground: "215 30% 25%",
    primary: "210 85% 55%", // Strong Blue
    primaryForeground: "0 0% 100%",
    secondary: "190 50% 90%", // Light Cyan
    secondaryForeground: "190 30% 30%",
    muted: "200 40% 92%",
    mutedForeground: "200 20% 50%",
    accent: "170 70% 45%", // Teal
    accentForeground: "0 0% 100%",
    destructive: "0 80% 60%",
    destructiveForeground: "0 0% 100%",
    border: "200 30% 80%",
    input: "0 0% 100%",
    ring: "210 85% 55%",
  }
};

export const DEFAULT_THEME_ID = defaultLightTheme.id;

export const ALL_THEMES_DEFINITIONS: ThemeDefinition[] = [
  crimsonDarkTheme,
  oceanBlueTheme,
];

// Ensure ThemeDefinition type is also exported if it's used elsewhere from this module.
// If ThemeDefinition is only used internally in this file, this export is not strictly necessary
// for resolving the "module not found" error but is good practice if other files might import the type.
export type { ThemeDefinition };
