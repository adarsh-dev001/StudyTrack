
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';
import QuickOnboardingModal from '@/components/onboarding/QuickOnboardingModal'; // New Import
import { useRouter } from 'next/navigation'; // New Import

const dynamicOutputs = ["Notes", "Quizzes", "Summaries", "Study Plans", "Solutions"];

const taglineText = "Master any subject with personalized study plans, instant doubt solving, and engaging rewards — all on one platform. Crack competitive exams like JEE, NEET, UPSC & more, with confidence.";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

function HeroSectionComponent() {
  const [outputIndex, setOutputIndex] = useState(0);
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showQuickOnboardingModal, setShowQuickOnboardingModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setOutputIndex((prevIndex) => (prevIndex + 1) % dynamicOutputs.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser && !authLoading) {
      setIsLoadingProfile(true);
      const profileRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      getDoc(profileRef).then(docSnap => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfileData);
        } else {
          setUserProfile(null); // Or some default indicating no profile yet
        }
      }).catch(console.error)
      .finally(() => setIsLoadingProfile(false));
    } else if (!currentUser && !authLoading) {
      setUserProfile(null);
      setIsLoadingProfile(false);
    }
  }, [currentUser, authLoading]);

  const handleExploreAiToolsClick = () => {
    if (authLoading || isLoadingProfile) return; // Wait for auth/profile to load

    if (currentUser) {
      if (userProfile?.onboardingCompleted || userProfile?.quickOnboardingCompleted) {
        router.push('/ai-tools');
      } else {
        setShowQuickOnboardingModal(true);
      }
    } else { // Anonymous user
      const anonOnboardingDone = localStorage.getItem('quickOnboardingDone_anon_v2') === 'true';
      if (anonOnboardingDone) {
        router.push('/ai-tools');
      } else {
        setShowQuickOnboardingModal(true);
      }
    }
  };
  
  const handleQuickOnboardingComplete = () => {
    setShowQuickOnboardingModal(false);
    if (!currentUser) { // For anonymous users
      localStorage.setItem('quickOnboardingDone_anon_v2', 'true');
    }
    // For logged-in users, their profile is updated by the modal itself.
    // A local state update for userProfile could be done here for immediate UI feedback if needed,
    // but onSnapshot should eventually update it.
    router.push('/ai-tools');
  };


  return (
    <>
      <section className="w-full py-16 md:py-24 lg:py-32 xl:py-40 bg-gradient-to-br from-sky-100/50 via-background to-background dark:from-sky-900/20">
        <motion.div
          className="container mx-auto px-4 md:px-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 }}}}
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center xl:gap-12">
            <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
              <motion.h1
                className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-tight md:leading-snug lg:leading-snug"
                variants={itemVariants}
              >
                <span className="block text-slate-700 dark:text-white">Ace Your Exams.</span>
                <span className="block text-primary">
                  Get AI Generated&nbsp;
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={dynamicOutputs[outputIndex]}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="inline-block"
                    >
                      {dynamicOutputs[outputIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.h1>
              <motion.p
                className="max-w-[600px] text-muted-foreground text-md sm:text-lg md:text-xl xl:text-2xl mx-auto lg:mx-0 leading-relaxed md:leading-relaxed"
                variants={itemVariants}
              >
                {taglineText}
              </motion.p>
              <motion.div
                className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
                variants={itemVariants}
              >
                <Button size="xl" asChild className="shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow text-base sm:text-lg py-3.5 px-7">
                  <Link href="/signup">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="xl" 
                  onClick={handleExploreAiToolsClick}
                  disabled={authLoading || isLoadingProfile}
                  className="text-base sm:text-lg py-3.5 px-7 border-border hover:bg-accent/10 hover:border-accent"
                >
                  Explore AI Tools
                  <Zap className="ml-2 h-5 w-5 text-accent" />
                </Button>
              </motion.div>
            </div>
            <motion.div
              className="relative mx-auto w-full max-w-lg aspect-[4/3] overflow-hidden rounded-xl lg:max-w-xl mt-8 lg:mt-0"
              variants={itemVariants}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            >
              <Image
                src="/images/Hero_iamge.png"
                alt="Diverse students achieve academic success using StudyTrack AI features like Personalized Syllabus and AI Generated Notes on laptops and tablets"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
                style={{ objectFit: 'cover' }}
                className="rounded-xl shadow-2xl"
                data-ai-hint="diverse students learning AI"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent rounded-xl"></div>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <QuickOnboardingModal
        isOpen={showQuickOnboardingModal}
        onOpenChange={setShowQuickOnboardingModal}
        onComplete={handleQuickOnboardingComplete}
      />
    </>
  );
}

export default React.memo(HeroSectionComponent);

