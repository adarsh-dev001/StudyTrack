
// This page is no longer directly used for mandatory onboarding.
// Onboarding is now contextual, triggered by AI tool usage if profile is incomplete.
// Keeping the file for now in case it's needed for a manual "Edit Full Profile" later,
// but its current role as an automatic redirect target is removed.

// 'use client';

// import React, { useEffect } from 'react'; 
// import { useAuth } from '@/contexts/auth-context';
// import { useRouter } from 'next/navigation';
// import OnboardingForm from '@/components/onboarding/onboarding-form';
// import { Loader2 } from 'lucide-react';
// import { useToast } from '@/hooks/use-toast';

export default function OnboardingPage_DEPRECATED() {
//   const { currentUser, loading: authLoading } = useAuth();
//   const router = useRouter();
//   const { toast } = useToast();

//   useEffect(() => {
//     if (!authLoading && !currentUser) {
//       router.push('/login');
//     }
//     // If user is logged in and somehow lands here but onboarding IS complete,
//     // redirect them away (e.g., to dashboard). This logic would typically be
//     // in the AppLayout or a similar higher-order component.
//     // For now, if they access this page directly, we assume they intend to be here
//     // if logged in, or the AI tool will handle the contextual trigger.
//   }, [currentUser, authLoading, router]);

//   const handleOnboardingSuccess = () => {
//     toast({
//         title: 'Profile Setup Complete! 🎉',
//         description: "Your preferences have been saved. You're all set to explore StudyTrack!",
//         duration: 3000,
//     });
//     // The redirect after contextual onboarding is handled by the calling page.
//     // If this page were to be used standalone, it would redirect here:
//     // router.push('/dashboard'); 
//   };

//   if (authLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <Loader2 className="h-12 w-12 animate-spin text-primary" />
//       </div>
//     );
//   }

//   if (!currentUser) {
//     return null; 
//   }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-2 sm:p-4 md:p-6 lg:p-8">
        {/* <OnboardingForm userId={currentUser.uid} onOnboardingSuccess={handleOnboardingSuccess} /> */}
        <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-primary mb-4">Profile Setup</h1>
            <p className="text-muted-foreground">
                Profile setup is now handled contextually when you first use an AI feature.
            </p>
            <p className="text-muted-foreground mt-2">
                You can manage your settings <a href="/settings" className="text-primary underline">here</a>.
            </p>
        </div>
    </div>
  );
}
