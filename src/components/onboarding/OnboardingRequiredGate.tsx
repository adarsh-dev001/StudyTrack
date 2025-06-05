
// This component is being deprecated as onboarding is now handled contextually by AI tool pages.
// The logic for showing a modal with the OnboardingForm will reside directly in those pages.
// Keeping the file for now to avoid breaking imports immediately, but it should be removed
// once all AI tool pages are updated.

// 'use client';

// import React from 'react';
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { UserCheck, ArrowRight, ShieldCheck } from "lucide-react";

// interface OnboardingRequiredGateProps {
//   featureName?: string; 
// }

export default function OnboardingRequiredGate_DEPRECATED({ featureName }: {featureName?: string}) {
  return (
    // <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-4 sm:p-6">
    //   <Alert variant="default" className="max-w-lg w-full shadow-xl border-primary/30 bg-primary/5">
    //     <ShieldCheck className="h-6 w-6 text-primary" />
    //     <AlertTitle className="text-xl font-semibold text-primary mt-1">
    //       Complete Your Profile to Unlock AI Access
    //     </AlertTitle>
    //     <AlertDescription className="mt-3 text-muted-foreground text-sm sm:text-base">
    //       To access this {featureName ? `"${featureName}" ` : ''}AI feature, please complete your academic and personal profile first.
    //       This helps us tailor the experience just for you!
    //       <br className="my-1"/>
    //       You'll be redirected to the profile setup page — once it's 100% complete, you'll gain full access to all AI tools on the platform. 🚀
    //     </AlertDescription>
    //     <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
    //       <Button asChild size="lg" className="text-sm sm:text-base">
    //         <Link href="/onboarding">
    //           Complete Profile Now <ArrowRight className="ml-2 h-4 w-4" />
    //         </Link>
    //       </Button>
    //       <Button asChild variant="outline" size="lg" className="text-sm sm:text-base">
    //         <Link href="/dashboard">Go to Dashboard</Link>
    //       </Button>
    //     </div>
    //   </Alert>
    // </div>
    null
  );
}
