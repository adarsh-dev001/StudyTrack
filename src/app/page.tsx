
// Removed 'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Skeleton } from '@/components/ui/skeleton';

// Direct imports for sections instead of React.lazy
import HeroSection from '@/components/landing/hero-section';
import FeaturesSection from '@/components/landing/features-section';
import KeyFeaturesSummary from '@/components/landing/key-features-summary';
import TestimonialsSection from '@/components/landing/testimonials-section';
import FinalCtaSection from '@/components/landing/final-cta-section';
import BlogPreviewSection from '@/components/landing/blog-preview-section'; // This is the Server Component

function LandingPageFallback() {
  return (
    <div className="space-y-16 md:space-y-24 px-4 md:px-6 py-12 md:py-16 lg:py-20">
      {/* Hero Skeleton */}
      <Skeleton className="h-[450px] w-full rounded-xl" />
      
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
      {/* Removed motion.main wrapper. Framer Motion animations should be within individual Client Components if needed. */}
      <main className="flex-1">
        {/* Suspense can still be used if BlogPreviewSection or other server components do async work */}
        <Suspense fallback={<LandingPageFallback />}>
          <HeroSection />
          <FeaturesSection />
          <BlogPreviewSection /> {/* This Server Component can now fetch data correctly */}
          <KeyFeaturesSummary />
          <TestimonialsSection />
          <FinalCtaSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
