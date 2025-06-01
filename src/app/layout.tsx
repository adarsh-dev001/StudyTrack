
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'StudyTrack - Ace Your Competitive Exams',
  description: 'Your all-in-one study planner, productivity tracker, and AI-powered learning assistant for NEET, UPSC, JEE, and more.',
  manifest: '/manifest.json', // Link to the manifest file
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
        <meta name="msapplication-config" content="/browserconfig.xml" /> {/* You might want to create this file later */}
        <meta name="msapplication-TileColor" content="#7DD3FC" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#7DD3FC" />

        {/* Add to homescreen for Chrome on Android */}
        {/* <link rel="manifest" href="/manifest.json" /> */} {/* Metadata object handles this for Next.js 13+ App Router */}
        
        {/* Add to homescreen for Safari on iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" /> {/* Create this icon */}
        {/* You can add more apple-touch-icon sizes if needed */}
        
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" /> {/* Create this icon */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" /> {/* Create this icon */}
        
        {/* Preconnect to Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
