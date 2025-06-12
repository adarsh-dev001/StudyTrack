'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

interface OnboardingGateProps {
  featureName?: string;
  hasPaid: boolean;
}

export default function OnboardingGate({ featureName, hasPaid }: OnboardingGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-250px)] text-center p-4 sm:p-6">
      <Alert variant="default" className="max-w-lg w-full shadow-xl border-primary/30 bg-primary/5">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <AlertTitle className="text-xl font-semibold text-primary mt-1">
          {hasPaid ? 'Complete Your Profile' : 'Upgrade Required'}
        </AlertTitle>
        <AlertDescription className="mt-3 text-muted-foreground text-sm sm:text-base">
          {hasPaid ? (
            <>
              To access this {featureName ? `"${featureName}" ` : ''}feature, please complete your profile setup.
              This helps us tailor the experience just for you!
              <br className="my-1"/>
              You'll be redirected to the profile setup page — once it's complete, you'll gain full access to all features. 🚀
            </>
          ) : (
            <>
              To access this {featureName ? `"${featureName}" ` : ''}feature, please upgrade your account.
              <br className="my-1"/>
              After upgrading, you'll be guided through a quick profile setup to personalize your experience.
            </>
          )}
        </AlertDescription>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          {hasPaid ? (
            <Button asChild size="lg" className="text-sm sm:text-base">
              <Link href="/onboarding">
                Complete Profile Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="text-sm sm:text-base">
              <Link href="/pricing">
                View Pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" size="lg" className="text-sm sm:text-base">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
} 