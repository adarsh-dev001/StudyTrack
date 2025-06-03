'use client';

import React, { Suspense } from 'react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Lazy load sections
const HeroSection = React.lazy(() => import('@/components/landing/hero-section'));
const FeaturesSection = React.lazy(() => import('@/components/landing/features-section'));
const KeyFeaturesSummary = React.lazy(() => import('@/components/landing/key-features-summary'));
const TestimonialsSection = React.lazy(() => import('@/components/landing/testimonials-section'));
const FinalCtaSection = React.lazy(() => import('@/components/landing/final-cta-section'));
// Removed unused: const BlogPreviewSection = React.lazy(() => import('@/components/landing/blog-preview-section'));


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

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1"
      >
        <Suspense fallback={<LandingPageFallback />}>
          <HeroSection />
          <FeaturesSection />
          {/* If BlogPreviewSection is needed, it should be re-added here */}
          <KeyFeaturesSummary />
          <TestimonialsSection />
          <FinalCtaSection />
        </Suspense>
      </motion.main>
      <Footer />
    </div>
  );
}
