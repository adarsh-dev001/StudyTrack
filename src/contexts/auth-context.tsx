
'use client';

import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  // Removed GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_THEME_ID } from '@/lib/themes'; 
import type { UserProfileData, QuickOnboardingDataToStore } from '@/lib/profile-types'; 

const ANON_USER_ID_KEY = 'anonUserId_studytrack_v2'; // Ensure this matches the key used in QuickOnboardingModal

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email_param: string, password_param: string) => Promise<void>; 
  signIn: (email_param: string, password_param: string) => Promise<void>;
  // Removed signInWithGoogle
  logOut: () => Promise<void>;
}

// Note: QuickOnboardingDataFromAnon should match what QuickOnboardingModal saves for anonymous users.
// It seems QuickOnboardingDataToStore already has the correct structure.
// type QuickOnboardingDataFromAnon = QuickOnboardingDataToStore;


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const migrateAnonymousData = useCallback(async (userId: string, userEmail: string | null) => {
    const anonId = localStorage.getItem(ANON_USER_ID_KEY);
    if (!anonId) return;

    try {
      const anonProfileRef = doc(db, 'anonymousProfiles', anonId);
      const anonProfileSnap = await getDoc(anonProfileRef);

      if (anonProfileSnap.exists()) {
        const anonData = anonProfileSnap.data() as QuickOnboardingDataToStore;
        const userProfileRef = doc(db, 'users', userId, 'userProfile', 'profile');
        const userProfileSnap = await getDoc(userProfileRef);
        let existingUserProfile = userProfileSnap.exists() ? userProfileSnap.data() as UserProfileData : null;

        // Only migrate if full onboarding hasn't been completed OR if quick onboarding data from anon is more recent/relevant
        // For simplicity here, if anon quick onboarding was done, we ensure its flags are set.
        if (anonData.quickOnboardingCompleted && (!existingUserProfile || !existingUserProfile.hasCompletedOnboarding)) {
          const updatePayload: Partial<UserProfileData> = {
            email: existingUserProfile?.email || userEmail || '',
            quickOnboardingCompleted: true,
            hasCompletedOnboarding: true, // Key: Set this to true
            onboardingCompleted: existingUserProfile?.onboardingCompleted || true, // Also ensure this reflects general completion
          };

          if (anonData.targetExam && anonData.targetExam.length > 0) {
            updatePayload.targetExams = anonData.targetExam; // anonData.targetExam should be string[]
            if (anonData.targetExam[0].toLowerCase() === 'other' && anonData.otherExamName) {
              updatePayload.otherExamName = anonData.otherExamName;
            } else if (anonData.targetExam[0].toLowerCase() !== 'other') {
              updatePayload.otherExamName = ''; 
            }
          } else if (existingUserProfile?.targetExams) {
             updatePayload.targetExams = existingUserProfile.targetExams;
             updatePayload.otherExamName = existingUserProfile.otherExamName;
          }


          if (anonData.preparationLevel) {
            updatePayload.preparationLevel = anonData.preparationLevel;
          } else if (existingUserProfile?.preparationLevel) {
            updatePayload.preparationLevel = existingUserProfile.preparationLevel;
          }
          
          // Initialize other fields if new profile, or merge with existing (which is handled by setDoc merge:true)
          if (!existingUserProfile) {
            updatePayload.xp = 0;
            updatePayload.coins = 0;
            updatePayload.earnedBadgeIds = [];
            updatePayload.purchasedItemIds = [];
            updatePayload.activeThemeId = DEFAULT_THEME_ID;
            updatePayload.dailyChallengeStatus = {};
            updatePayload.lastInteractionDates = [];
          } else {
            // Merge with existing, respecting fields already set during a potential full onboarding
            updatePayload.fullName = existingUserProfile.fullName;
            updatePayload.age = existingUserProfile.age;
            updatePayload.location = existingUserProfile.location;
            updatePayload.languageMedium = existingUserProfile.languageMedium;
            updatePayload.studyMode = existingUserProfile.studyMode;
            updatePayload.examPhase = existingUserProfile.examPhase;
            updatePayload.previousAttempts = existingUserProfile.previousAttempts;
            updatePayload.examAttemptYear = existingUserProfile.examAttemptYear;
            updatePayload.subjectDetails = existingUserProfile.subjectDetails;
            updatePayload.dailyStudyHours = anonData.studyTimePerDay || existingUserProfile.dailyStudyHours;
            updatePayload.preferredStudyTime = existingUserProfile.preferredStudyTime;
            updatePayload.distractionStruggles = existingUserProfile.distractionStruggles;
            updatePayload.motivationType = existingUserProfile.motivationType;
            updatePayload.preferredLearningStyles = existingUserProfile.preferredLearningStyles;
            updatePayload.socialVisibilityPublic = existingUserProfile.socialVisibilityPublic;
            updatePayload.weakSubjects = anonData.strugglingSubject && anonData.strugglingSubject !== "None/Other" ? [anonData.strugglingSubject] : existingUserProfile.weakSubjects;
            updatePayload.strongSubjects = existingUserProfile.strongSubjects;

          }

          await setDoc(userProfileRef, updatePayload, { merge: true });
          
          toast({ title: "Welcome!", description: "Your previous preferences have been linked to your account." });
        }
        
        await deleteDoc(anonProfileRef);
        localStorage.removeItem(ANON_USER_ID_KEY);
      }
    } catch (migrationError) {
      console.error("Error migrating anonymous data:", migrationError);
      toast({ title: "Data Migration Issue", description: "Could not fully link previous preferences.", variant: "default" });
      localStorage.removeItem(ANON_USER_ID_KEY); // Still remove it to avoid repeated attempts
    }
  }, [toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => { 
        if (user) {
          setCurrentUser(user);
          await migrateAnonymousData(user.uid, user.email); 
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    );
    return unsubscribe;
  }, [toast, migrateAnonymousData]);

  const signUp = useCallback(async (email_param: string, password_param: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email_param, password_param);
      
      // Initial profile setup is deferred until migration or first feature access
      // But we ensure a basic document exists if migrateAnonymousData doesn't create it.
      const userProfileRef = doc(db, 'users', userCredential.user.uid, 'userProfile', 'profile');
      const profileSnap = await getDoc(userProfileRef);
      if (!profileSnap.exists()) {
          const initialProfileData: UserProfileData = {
            email: email_param,
            onboardingCompleted: false, 
            quickOnboardingCompleted: false, 
            xp: 0,
            coins: 0,
            earnedBadgeIds: [],
            purchasedItemIds: [],
            activeThemeId: DEFAULT_THEME_ID,
            dailyChallengeStatus: {},
            lastInteractionDates: [],
            hasCompletedOnboarding: false,
          };
          await setDoc(userProfileRef, initialProfileData, { merge: true }); 
      }
      
      setCurrentUser(userCredential.user); 
      await migrateAnonymousData(userCredential.user.uid, userCredential.user.email); 

      toast({
        title: 'Signup Successful!',
        description: 'Welcome to StudyTrack! You might be asked a few quick questions to personalize your AI tools.',
      });
      router.push('/dashboard'); // Or to quick onboarding if not done via migration
    } catch (err: any) {
      setError(err.message);
      if (err.code === 'auth/email-already-in-use') {
        toast({
          title: 'Signup Failed',
          description: 'This email address is already registered. Please use a different email or try logging in.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Signup Failed',
          description: err.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [router, toast, migrateAnonymousData]);

  const signIn = useCallback(async (email_param: string, password_param: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email_param, password_param);
      await migrateAnonymousData(userCredential.user.uid, userCredential.user.email); 

      toast({
        title: 'Login Successful!',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    } catch (err: any)      {
        setError(err.message);
        toast({
          title: 'Login Failed',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, [router, toast, migrateAnonymousData]);
  
    const logOut = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        await signOut(auth);
        toast({
          title: 'Logged Out',
          description: 'You have been successfully logged out.',
        });
        router.push('/login');
      } catch (err: any) {
        setError(err.message);
        toast({
          title: 'Logout Failed',
          description: err.message,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }, [router, toast]);
  
    const value = useMemo(() => ({
      currentUser,
      loading,
      error,
      signUp,
      signIn,
      // signInWithGoogle removed
      logOut,
    }), [currentUser, loading, error, signUp, signIn, logOut]); // signInWithGoogle removed from dependencies
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

