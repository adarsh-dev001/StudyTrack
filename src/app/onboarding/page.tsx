
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/onboarding/onboarding-form';
import { Loader2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function OnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast(); // Added for success message before redirect
  // const [onboardingCompleteForPage, setOnboardingCompleteForPage] = useState(false); // No longer needed for UI switch

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
    // No need to check onboardingCompleted here, AppLayout will handle redirection if already completed.
  }, [currentUser, authLoading, router]);

  const handleOnboardingSuccess = () => {
    // setOnboardingCompleteForPage(true); // Not strictly necessary if we redirect immediately
    toast({
        title: 'Profile Setup Complete! 🎉',
        description: "We've saved your preferences. Redirecting to your dashboard...",
    });
    // Add a slight delay for the toast to be visible before redirecting
    setTimeout(() => {
        router.push('/dashboard');
    }, 1500); 
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null; // Or a message, though useEffect should redirect
  }

  // The "Setup Complete" card is removed as we now auto-redirect.
  // The AppLayout will handle redirecting away from /onboarding if already completed.

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-4 sm:p-6 lg:p-8">
        <OnboardingForm userId={currentUser.uid} onOnboardingSuccess={handleOnboardingSuccess} />
    </div>
  );
}
