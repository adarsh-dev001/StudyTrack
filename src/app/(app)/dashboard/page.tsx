
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, CalendarDays, BrainCircuit, Loader2, Wand2, Lightbulb, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import DashboardMetricsCard from '@/components/dashboard/DashboardMetricsCard';
import type { UserProfileData, StreakData } from '@/lib/profile-types';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DailyChallengesCard = React.lazy(() => import('@/components/dashboard/DailyChallengesCard'));
const TaskOverviewWidget = React.lazy(() => import('@/components/dashboard/TaskOverviewWidget'));

function DailyChallengesCardFallback() {
  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-1" />
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        {[1, 2].map(i => (
          <div key={i} className="p-3 sm:p-4 border rounded-lg bg-card/40 shadow-sm space-y-2">
            <div className="flex items-start gap-2">
              <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-md" />
              <div className="w-full">
                <Skeleton className="h-4 sm:h-5 w-3/4 mb-1" />
                <Skeleton className="h-3 sm:h-4 w-full" />
              </div>
            </div>
            <Skeleton className="h-2 sm:h-2.5 w-full mt-1" />
            <Skeleton className="h-7 sm:h-8 w-1/3 ml-auto mt-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TaskOverviewWidgetFallback() {
  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4 mt-1" />
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <div className="space-y-2 px-4 pb-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-2.5 rounded-md border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
              <div className="flex-grow">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-12 self-start sm:self-center" />
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-3">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function DashboardPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const onboardingCompleted = userProfile?.onboardingCompleted || userProfile?.quickOnboardingCompleted || false;

  useEffect(() => {
    if (!currentUser?.uid || !db) {
      setLoadingStreak(false);
      setStreakData(null);
      setLoadingProfile(false);
      setUserProfile(null);
      return;
    }

    setLoadingStreak(true);
    const userStreakDocRef = doc(db, 'users', currentUser.uid, 'streaksData', 'main');
    const unsubscribeStreak = onSnapshot(
      userStreakDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setStreakData(docSnap.data() as StreakData);
        } else {
          setStreakData({ currentStreak: 0, longestStreak: 0, lastCheckInDate: null });
        }
        setLoadingStreak(false);
      },
      (error) => {
        console.error('Error fetching streak data for dashboard:', error);
        setStreakData(null);
        setLoadingStreak(false);
      }
    );

    setLoadingProfile(true);
    const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
    const unsubscribeProfile = onSnapshot(userProfileDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfileData);
      } else {
        setUserProfile(null); // Or a default profile structure
      }
      setLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching user profile for dashboard:", error);
      setUserProfile(null);
      setLoadingProfile(false);
    });

    return () => {
      unsubscribeStreak();
      unsubscribeProfile();
    };
  }, [currentUser?.uid]);

  const welcomeName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const currentStreakDisplay = authLoading || loadingStreak ? <Loader2 className="inline-block h-5 w-5 animate-spin" /> : (streakData?.currentStreak ?? 0);

  if (authLoading || loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight md:text-4xl">
          👋 Welcome back, {welcomeName}!
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground">
          {loadingStreak ? (
            <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
          ) : (
            `Ready to conquer Day ${currentStreakDisplay} of your streak? Let's make today productive! 🚀`
          )}
        </p>
      </motion.div>

      {currentUser && (
        <>
          {/* Get Started Section - Conditionally Rendered */}
          {!onboardingCompleted && (
            <motion.section
              className="space-y-4"
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Get Started with StudyTrack AI</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <motion.div variants={cardVariants}>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardHeader>
                      <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                        <Wand2 className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">Generate Your First Study Plan</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Let AI create a personalized syllabus for your exams.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild className="w-full text-xs sm:text-sm">
                        <Link href="/ai-tools/syllabus-suggester">
                          Create Plan <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
                <motion.div variants={cardVariants}>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
                    <CardHeader>
                      <div className="bg-primary/10 p-3 rounded-lg w-fit mb-2">
                        <Lightbulb className="h-7 w-7 text-primary" />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">Ask an AI Doubt</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">Get instant, clear explanations for your academic questions.</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild className="w-full text-xs sm:text-sm">
                        <Link href="/ai-tools/doubt-solver">
                          Ask Now <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>
            </motion.section>
          )}

          <DashboardMetricsCard streakData={streakData} loadingStreak={loadingStreak} />

          {/* Your AI Study Tools Widget */}
          <motion.section
            className="space-y-4"
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: onboardingCompleted ? 0 : 0.2 }}
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Your AI Study Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: "AI Notes Generator", description: "Summarize text & PDFs into notes.", icon: FileText, link: "/ai-tools/material-summarizer", color: "text-amber-500", bgColor: "bg-amber-500/10" },
                { title: "AI Syllabus Suggester", description: "Get personalized study plans.", icon: Wand2, link: "/ai-tools/syllabus-suggester", color: "text-sky-500", bgColor: "bg-sky-500/10" },
                { title: "AI Doubt Solver", description: "Instant, clear explanations.", icon: MessageSquare, link: "/ai-tools/doubt-solver", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
              ].map((tool, index) => (
                <motion.div key={tool.title} variants={cardVariants} whileHover={{ y: -5 }}>
                  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 h-full", tool.bgColor)}>
                    <CardHeader>
                      <div className={cn("p-3 rounded-lg w-fit mb-2", tool.bgColor.replace('bg-', 'bg-opacity-20'))}>
                        <tool.icon className={cn("h-7 w-7", tool.color)} />
                      </div>
                      <CardTitle className="text-lg sm:text-xl">{tool.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button asChild variant="link" className={cn("p-0 h-auto text-xs sm:text-sm", tool.color)}>
                        <Link href={tool.link}>
                          Use Tool <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Suspense fallback={<DailyChallengesCardFallback />}>
                <DailyChallengesCard />
              </Suspense>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Suspense fallback={<TaskOverviewWidgetFallback />}>
                <TaskOverviewWidget
                  title="Today's Focus / Next Up"
                  description="Your upcoming tasks. (AI Syllabus integration coming soon!)"
                />
              </Suspense>
            </motion.div>
          </div>
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="shadow-lg">
          <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl font-semibold">Quick Actions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Jump right into your study tools.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 p-4 sm:p-6">
              <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                  <Link href="/study-planner">
                      <CalendarDays className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Go to Planner
                  </Link>
              </Button>
              <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                  <Link href="/tasks#addTask">
                      <ListChecks className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Add New Task
                  </Link>
              </Button>
              <Button variant="default" size="default" asChild className="w-full py-2.5 sm:py-3 text-sm sm:text-base">
                  <Link href="/ai-tools">
                      <BrainCircuit className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Explore AI Tools
                  </Link>
              </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
