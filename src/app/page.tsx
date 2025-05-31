
import React, { Suspense } from 'react';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { Skeleton } from '@/components/ui/skeleton';

const HeroSection = React.lazy(() => import('@/components/landing/hero-section').then(module => ({ default: module.HeroSection })));
const FeaturesSection = React.lazy(() => import('@/components/landing/features-section').then(module => ({ default: module.FeaturesSection })));
const BlogPreviewSection = React.lazy(() => import('@/components/landing/blog-preview-section').then(module => ({ default: module.BlogPreviewSection })));
const CtaSection = React.lazy(() => import('@/components/landing/cta-section').then(module => ({ default: module.CtaSection })));

function LandingPageSectionsFallback() {
  return (
    <div className="space-y-12 px-4 md:px-6 py-12 md:py-24 lg:py-32">
      {/* Hero Skeleton */}
      <Skeleton className="h-[400px] w-full rounded-xl" />
      
      {/* Features Skeleton */}
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-8 w-2/3 mx-auto" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
          <Skeleton className="h-[150px] w-full rounded-xl" />
        </div>
      </div>

      {/* Blog Preview Skeleton */}
       <div className="space-y-8">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-8 w-2/3 mx-auto" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
      
      {/* CTA Skeleton */}
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<LandingPageSectionsFallback />}>
          <HeroSection />
          <FeaturesSection />
          <BlogPreviewSection />
          <CtaSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
