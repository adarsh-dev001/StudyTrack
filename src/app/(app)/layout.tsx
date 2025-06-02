
'use client';

import type { Metadata } from 'next';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger as MobileSidebarTrigger } from '@/components/ui/sidebar';
import { BookOpenText, Settings, LogOut, Loader2, Coins } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation'; // Added usePathname
import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { UserProfileData } from '@/lib/profile-types';


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading: authLoading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);


  useEffect(() => {
    if (!authLoading && !currentUser) {
      // If auth is done loading and there's no user, redirect to login.
      // This handles the case where a user might try to access an app page directly without being logged in.
      if (pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/blog') && pathname !== '/' && pathname !=='/terms' && pathname !=='/privacy') {
        router.push('/login');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;

    if (currentUser?.uid && db) {
      setLoadingProfile(true);
      const userProfileDocRef = doc(db, 'users', currentUser.uid, 'userProfile', 'profile');
      
      unsubscribeProfile = onSnapshot(userProfileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfileData);
        } else {
          // Profile doesn't exist, implies onboarding not completed
          setUserProfile({ onboardingCompleted: false } as UserProfileData); // Set a minimal profile
        }
        setLoadingProfile(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile({ onboardingCompleted: false } as UserProfileData); // Assume not completed on error
        setLoadingProfile(false);
      });
    } else if (!currentUser?.uid) {
      // No user, clear profile data and set loading to false
      setUserProfile(null); 
      setLoadingProfile(false);
    }

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [currentUser?.uid]);

  // Onboarding redirection logic
  useEffect(() => {
    if (!authLoading && !loadingProfile && currentUser) {
      const isOnboardingPage = pathname === '/onboarding';
      const isAuthPage = pathname === '/login' || pathname === '/signup';

      if (userProfile?.onboardingCompleted === false && !isOnboardingPage && !isAuthPage) {
        router.push('/onboarding');
      } else if (userProfile?.onboardingCompleted === true && isOnboardingPage) {
        router.push('/dashboard');
      }
    }
  }, [currentUser, userProfile, authLoading, loadingProfile, pathname, router]);


  if (authLoading || (currentUser && loadingProfile && pathname !== '/onboarding' && pathname !== '/login' && pathname !== '/signup' )) {
    // Show loader if auth is loading, OR if user is present but profile is still loading (unless on onboarding/auth pages)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If still loading and not yet redirected, or if navigating to onboarding/auth pages when profile is loading
  if ((loadingProfile && currentUser) && (pathname === '/onboarding' || pathname === '/login' || pathname === '/signup')) {
     // Allow rendering children for onboarding/auth pages even if profile is loading
  } else if (!currentUser && !authLoading) {
    // If not loading auth and no current user, and not on a public marketing page,
    // this implies a redirect to /login is pending or should happen from the earlier effect.
    // Returning null here avoids flashing app layout before redirect.
    // Allow marketing pages and root to render without user.
    const marketingPages = ['/', '/blog', '/terms', '/privacy']; 
    if (!marketingPages.some(p => pathname === p || (p === '/blog' && pathname.startsWith('/blog')))) {
         // This condition might be too broad, the primary redirect is in the first useEffect.
         // For now, let it pass to avoid breaking marketing page access if user is logged out.
    }
  } else if (!currentUser && authLoading) {
     return (
       // Full screen loader if auth is still loading and no user yet.
       <div className="flex min-h-screen items-center justify-center bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
       </div>
     );
  }


  // If user is not logged in, but we are on a page that doesn't require auth (like /login, /signup, marketing pages), children should render.
  // If user is logged in, or if it's an auth page, render the layout.
  // The redirection logic above handles unauthorized access to app pages.
  // This check prevents rendering the AppLayout for users who are not logged in and are not on auth pages.
  if (!currentUser && pathname !== '/login' && pathname !== '/signup' && !pathname.startsWith('/blog') && pathname !== '/' && pathname !=='/terms' && pathname !=='/privacy') {
    // This case should ideally be caught by the first useEffect that redirects to /login.
    // Returning null here can prevent a flash of the AppLayout if the redirect is slightly delayed.
    return null;
  }


  const handleLogout = async () => {
    await logOut();
    // router.push('/login') is handled by logOut function in AuthContext or redirect effect
  };
  
  const userInitial = currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : (currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U');

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full"> {}
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0"> {}
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6 shrink-0">
            <div className="flex items-center gap-2">
              <MobileSidebarTrigger className="lg:hidden" />
              <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
                <BookOpenText className="h-6 w-6 text-primary" />
                <span className="font-headline text-xl font-bold text-foreground">StudyTrack</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser && (
                <Button variant="ghost" size="sm" asChild className="mr-1">
                  <Link href="/rewards-shop" className="flex items-center gap-1.5 px-2 py-1 h-auto">
                    <Coins className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold text-sm text-foreground">
                      {loadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : (userProfile?.coins ?? 0)}
                    </span>
                  </Link>
                </Button>
              )}

              {currentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        {}
                        <AvatarImage src="" alt="User avatar" /> 
                        <AvatarFallback>{userInitial}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {currentUser.displayName || 'User Name'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email || 'user@example.com'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-muted/30"> {}
            {children}
          </main>
        </SidebarInset>
      </div>
      {}
    </SidebarProvider>
  );
}
