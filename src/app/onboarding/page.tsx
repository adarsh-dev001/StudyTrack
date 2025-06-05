
'use client';

import React, { useEffect } from 'react'; // Removed useState as it's handled in OnboardingForm
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import OnboardingForm from '@/components/onboarding/onboarding-form'; // Path will be updated
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OnboardingPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleOnboardingSuccess = () => {
    toast({
        title: 'Profile Setup Complete! 🎉',
        description: "We've saved your preferences. You're all set!", // Updated description
        duration: 3000,
    });
    setTimeout(() => {
        // Redirect to dashboard or AI recommendations as per previous logic
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
    // This state should ideally be caught by the useEffect above,
    // but as a fallback, prevent rendering the form.
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
        <OnboardingForm userId={currentUser.uid} onOnboardingSuccess={handleOnboardingSuccess} />
    </div>
  );
}
