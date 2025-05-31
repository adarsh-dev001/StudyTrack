
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
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email_param: string, password_param: string, fullName_param: string) => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
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
  }, [toast]); // auth should be stable, toast is from a hook

  const signUp = useCallback(async (email_param: string, password_param: string, fullName_param: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email_param, password_param);
      await updateProfile(userCredential.user, { displayName: fullName_param });
      // onAuthStateChanged should pick this up, but to be safe for immediate UI updates:
      setCurrentUser(userCredential.user); 
      toast({
        title: 'Signup Successful!',
        description: 'Welcome to StudyTrack!',
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
  }, [auth, router, toast]); // setLoading, setError, setCurrentUser are stable

  const signIn = useCallback(async (email_param: string, password_param: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email_param, password_param);
      toast({
        title: 'Login Successful!',
        description: 'Welcome back!',
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Login Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [auth, router, toast]); // setLoading, setError are stable

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
  }, [auth, router, toast]); // setLoading, setError are stable

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
