
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
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  const handleOnboardingSuccess = () => {
    toast({
        title: 'Profile Setup Complete! 🎉',
        description: "We've saved your preferences. Generating your AI recommendations...",
    });
    setTimeout(() => {
        router.push('/ai-recommendations'); // Redirect to the new AI recommendations page
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
    return null; 
  }


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-4 sm:p-6 lg:p-8">
        <OnboardingForm userId={currentUser.uid} onOnboardingSuccess={handleOnboardingSuccess} />
    </div>
  );
}

    