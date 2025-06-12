
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
import type { UserProfileData } from '@/lib/profile-types'; 

const ANON_USER_ID_KEY = 'anonUserId_studytrack';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email_param: string, password_param: string) => Promise<void>; 
  signIn: (email_param: string, password_param: string) => Promise<void>;
  // Removed signInWithGoogle
  logOut: () => Promise<void>;
}

interface QuickOnboardingDataFromAnon {
  targetExam?: string;
  otherExamName?: string; 
  strugglingSubject?: string;
  studyTimePerDay?: string;
  quickOnboardingCompleted?: boolean;
  createdAt?: Timestamp;
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
        const anonData = anonProfileSnap.data() as QuickOnboardingDataFromAnon;
        const userProfileRef = doc(db, 'users', userId, 'userProfile', 'profile');
        const userProfileSnap = await getDoc(userProfileRef);
        let existingUserProfile = userProfileSnap.exists() ? userProfileSnap.data() as UserProfileData : null;

        if (!existingUserProfile || !existingUserProfile.onboardingCompleted || !existingUserProfile.quickOnboardingCompleted) {
          const updatePayload: Partial<UserProfileData> = {
            email: existingUserProfile?.email || userEmail || '',
            quickOnboardingCompleted: true,
            onboardingCompleted: existingUserProfile?.onboardingCompleted || false,
          };

          if (anonData.targetExam) {
            updatePayload.targetExams = [anonData.targetExam.toLowerCase().replace(/\s+/g, '_')];
            if (anonData.targetExam === "Other" && anonData.otherExamName) {
              updatePayload.otherExamName = anonData.otherExamName;
            } else if (anonData.targetExam === "Other") {
              updatePayload.otherExamName = "User Specified";
            }
          }
          if (anonData.strugglingSubject && anonData.strugglingSubject !== "None/Other") {
            updatePayload.weakSubjects = [anonData.strugglingSubject];
          }
          if (anonData.studyTimePerDay) {
            updatePayload.dailyStudyHours = anonData.studyTimePerDay;
          }
          
          if (!existingUserProfile) {
            updatePayload.xp = 0;
            updatePayload.coins = 0;
            updatePayload.earnedBadgeIds = [];
            updatePayload.purchasedItemIds = [];
            updatePayload.activeThemeId = DEFAULT_THEME_ID;
            updatePayload.dailyChallengeStatus = {};
            updatePayload.lastInteractionDates = [];
          }


          if (userProfileSnap.exists()) {
            await updateDoc(userProfileRef, updatePayload);
          } else {
            await setDoc(userProfileRef, updatePayload); 
          }
          
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
      
      const userProfileRef = doc(db, 'users', userCredential.user.uid, 'userProfile', 'profile');
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
      };
      await setDoc(userProfileRef, initialProfileData, { merge: true }); 

      setCurrentUser(userCredential.user); 
      await migrateAnonymousData(userCredential.user.uid, userCredential.user.email); 

      toast({
        title: 'Signup Successful!',
        description: 'Welcome to StudyTrack! Explore your dashboard.',
      });
      router.push('/dashboard');
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

