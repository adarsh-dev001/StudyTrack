
// Removed 'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Skeleton } from '@/components/ui/skeleton';
import type { Metadata } from 'next';

// Direct imports for sections instead of React.lazy
import HeroSection from '@/components/landing/hero-section';
import FeatureShowcaseSection from '@/components/landing/feature-showcase-section'; // New import
import FeaturesSection from '@/components/landing/features-section';
import KeyFeaturesSummary from '@/components/landing/key-features-summary';
import TestimonialsSection from '@/components/landing/testimonials-section';
import FinalCtaSection from '@/components/landing/final-cta-section';
import BlogPreviewSection from '@/components/landing/blog-preview-section'; 

export const metadata: Metadata = {
  title: 'StudyTrack AI - Smart Study Planner & AI Learning Assistant',
  description: 'Supercharge your exam prep for NEET, UPSC, JEE & more with StudyTrack AI. Get personalized study plans, AI notes, instant doubt solving, and gamified motivation. Start free!',
};

function LandingPageFallback() {
  return (
    <div className="space-y-16 md:space-y-24 px-4 md:px-6 py-12 md:py-16 lg:py-20">
      {/* Hero Skeleton */}
      <Skeleton className="h-[450px] w-full rounded-xl" />
      
      {/* Features Showcase Skeleton (New) */}
      <Skeleton className="h-[350px] w-full rounded-xl" />

      {/* Features Skeletons (multiple) */}
      <Skeleton className="h-[300px] w-full rounded-xl" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
      
      {/* Key Features Summary Skeleton */}
      <Skeleton className="h-[250px] w-full rounded-xl" />

      {/* Testimonials Skeleton */}
      <Skeleton className="h-[300px] w-full rounded-xl" />
      
      {/* Final CTA Skeleton */}
      <Skeleton className="h-[250px] w-full rounded-xl" />
    </div>
  );
}

// HomePage is now a Server Component
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<LandingPageFallback />}>
          <HeroSection />
          <FeatureShowcaseSection /> {/* Added the new section here */}
          <FeaturesSection />
          <BlogPreviewSection /> 
          <KeyFeaturesSummary />
          <TestimonialsSection />
          <FinalCtaSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
