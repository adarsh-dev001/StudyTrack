
import type {Metadata, Viewport} from 'next'; // Added Viewport type
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { Inter, Space_Grotesk } from 'next/font/google';
import { cn } from '@/lib/utils';

// Setup fonts with next/font
const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fontSpaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'StudyTrack - Ace Your Competitive Exams',
  description: 'Your all-in-one study planner, productivity tracker, and AI-powered learning assistant for NEET, UPSC, JEE, and more.',
  manifest: '/manifest.json', // Link to the manifest file
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [ // Updated themeColor to be an array for light/dark modes
    { media: '(prefers-color-scheme: light)', color: '#7DD3FC' }, // Sky Blue for light mode
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' }, // Darker blue for dark mode (example)
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="StudyTrack" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="StudyTrack" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#7DD3FC" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />
        <link rel="preconnect" href="https://placehold.co" />
        
        {/* Removed direct Google Font links, next/font handles this */}
      </head>
      <body 
        className={cn(
          "font-body antialiased",
          fontInter.variable,
          fontSpaceGrotesk.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
