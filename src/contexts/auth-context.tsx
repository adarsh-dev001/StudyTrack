
'use client';

import type { User } from 'firebase/auth';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase'; 
import { doc, setDoc, getDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_THEME_ID } from '@/lib/themes'; 
import type { UserProfileData, QuickOnboardingDataToStore } from '@/lib/profile-types'; // Updated import

const ANON_USER_ID_KEY = 'anonUserId_studytrack_v2'; // Updated key to potentially reset old anonymous data if needed

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email_param: string, password_param: string) => Promise<void>; 
  signIn: (email_param: string, password_param: string) => Promise<void>;
  logOut: () => Promise<void>;
}

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

        const shouldMigrate = !existingUserProfile || 
                              (!existingUserProfile.onboardingCompleted && !existingUserProfile.quickOnboardingCompleted);

        if (shouldMigrate) {
          const updatePayload: Partial<UserProfileData> = {
            email: existingUserProfile?.email || userEmail || '',
            quickOnboardingCompleted: true, // Mark quick onboarding as completed
            onboardingCompleted: existingUserProfile?.onboardingCompleted || false, // Preserve full onboarding
          };

          if (anonData.targetExam) {
            updatePayload.targetExams = [anonData.targetExam]; // Note: targetExam from anonData is already the 'value'
            if (anonData.targetExam === "other" && anonData.otherExamName) {
              updatePayload.otherExamName = anonData.otherExamName;
            }
          }
          if (anonData.strugglingSubject && anonData.strugglingSubject !== "None/Other") {
            updatePayload.weakSubjects = [anonData.strugglingSubject];
          }
          if (anonData.studyTimePerDay) {
            updatePayload.dailyStudyHours = anonData.studyTimePerDay;
          }
          
          // Initialize if profile doesn't exist or is minimal
          if (!existingUserProfile) {
            updatePayload.xp = 0;
            updatePayload.coins = 0;
            updatePayload.earnedBadgeIds = [];
            updatePayload.purchasedItemIds = [];
            updatePayload.activeThemeId = DEFAULT_THEME_ID;
            updatePayload.dailyChallengeStatus = {};
            updatePayload.lastInteractionDates = [];
          } else { // If profile exists, merge safely
            updatePayload.xp = existingUserProfile.xp || 0;
            updatePayload.coins = existingUserProfile.coins || 0;
            updatePayload.earnedBadgeIds = existingUserProfile.earnedBadgeIds || [];
            updatePayload.purchasedItemIds = existingUserProfile.purchasedItemIds || [];
            updatePayload.activeThemeId = existingUserProfile.activeThemeId === undefined ? DEFAULT_THEME_ID : existingUserProfile.activeThemeId;
            updatePayload.dailyChallengeStatus = existingUserProfile.dailyChallengeStatus || {};
            updatePayload.lastInteractionDates = existingUserProfile.lastInteractionDates || [];
          }

          await setDoc(userProfileRef, updatePayload, { merge: true }); // Use merge:true to be safe
          
          toast({ title: "Welcome!", description: "Your previous preferences have been linked to your account." });
        }
        
        // Delete anonymous profile only if data was successfully used or deemed not needed for migration
        await deleteDoc(anonProfileRef);
        localStorage.removeItem(ANON_USER_ID_KEY);
      }
    } catch (migrationError) {
      console.error("Error migrating anonymous data:", migrationError);
      toast({ title: "Data Migration Issue", description: "Could not fully link previous preferences.", variant: "default" });
      // Decide if to remove anonId here or retry later. For now, remove to avoid repeated errors for same issue.
      localStorage.removeItem(ANON_USER_ID_KEY);
    }
  }, [toast]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => { 
        setLoading(true); // Set loading true at the start of auth state change
        if (user) {
          setCurrentUser(user);
          await migrateAnonymousData(user.uid, user.email); 
        } else {
          setCurrentUser(null);
        }
        setLoading(false); // Set loading false after processing
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
      
      const userProfileRef = doc(db, 'users', userCredential.user.uid, 'userProfile', 'profile');
      // Check if profile already exists from a previous partial creation or anonymous migration attempt
      const existingProfileSnap = await getDoc(userProfileRef);
      const existingProfileData = existingProfileSnap.exists() ? existingProfileSnap.data() as UserProfileData : {};
      
      const initialProfileData: UserProfileData = {
        ...existingProfileData, // Preserve any data already there (e.g. from failed anon migration)
        email: email_param,
        onboardingCompleted: existingProfileData.onboardingCompleted || false, 
        quickOnboardingCompleted: existingProfileData.quickOnboardingCompleted || false, 
        xp: existingProfileData.xp || 0,
        coins: existingProfileData.coins || 0,
        earnedBadgeIds: existingProfileData.earnedBadgeIds || [],
        purchasedItemIds: existingProfileData.purchasedItemIds || [],
        activeThemeId: existingProfileData.activeThemeId === undefined ? DEFAULT_THEME_ID : existingProfileData.activeThemeId,
        dailyChallengeStatus: existingProfileData.dailyChallengeStatus || {},
        lastInteractionDates: existingProfileData.lastInteractionDates || [],
      };
      await setDoc(userProfileRef, initialProfileData, { merge: true }); 

      // setCurrentUser(userCredential.user); // Done by onAuthStateChanged
      // await migrateAnonymousData(userCredential.user.uid, userCredential.user.email); // Done by onAuthStateChanged

      toast({
        title: 'Signup Successful!',
        description: 'Welcome to StudyTrack! Redirecting to dashboard...',
      });
      router.push('/dashboard'); // Redirect after ensuring state is set by onAuthStateChanged
    } catch (err: any) {
      setError(err.message);
      if (err.code === 'auth/email-already-in-use') {
        toast({
          title: 'Signup Failed',
          description: 'This email address is already registered. Please try logging in.',
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
      // setLoading(false); // onAuthStateChanged will handle final loading state
    }
  }, [router, toast, migrateAnonymousData]); // Removed migrateAnonymousData as it's handled by onAuthStateChanged

  const signIn = useCallback(async (email_param: string, password_param: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email_param, password_param);
      // User state set by onAuthStateChanged, which also calls migrateAnonymousData
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
        setLoading(false); // Set loading false here for signIn
      }
    }, [router, toast]); // Removed migrateAnonymousData as it's handled by onAuthStateChanged
  
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
      logOut,
    }), [currentUser, loading, error, signUp, signIn, logOut]);
  
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  }

