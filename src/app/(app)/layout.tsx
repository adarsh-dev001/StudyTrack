
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
import { useRouter, usePathname } from 'next/navigation'; 
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
  const pathname = usePathname(); 
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);


  useEffect(() => {
    const isAiToolsPath = pathname.startsWith('/ai-tools');
    
    // Define paths that are public and might not require login.
    // For AppLayout, specific (app) group paths like /ai-tools are relevant here.
    // Marketing/auth pages are typically outside this layout.
    const isAllowedAnonymousAppPath = isAiToolsPath; // Add other (app) paths here if they become public

    if (!authLoading && !currentUser && !isAllowedAnonymousAppPath) {
      // User is not logged in, not loading, and not on an allowed anonymous path within this layout
      // (e.g., trying to access /dashboard, /settings etc. anonymously)
      // This check ensures that only truly protected app pages trigger a redirect.
      // We also exclude common public/auth paths to be safe, though they shouldn't be wrapped by AppLayout.
      const isMarketingOrAuthPath = pathname === '/login' ||
                                    pathname === '/signup' ||
                                    pathname.startsWith('/blog') ||
                                    pathname === '/' ||
                                    pathname === '/terms' ||
                                    pathname === '/privacy';
      if (!isMarketingOrAuthPath) { // Double check it's not a marketing/auth page
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
          setUserProfile({ onboardingCompleted: false } as UserProfileData); 
        }
        setLoadingProfile(false);
      }, (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile({ onboardingCompleted: false } as UserProfileData); 
        setLoadingProfile(false);
      });
    } else if (!currentUser?.uid) {
      setUserProfile(null); 
      setLoadingProfile(false);
    }

    return () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [currentUser?.uid]);


  if (authLoading || (currentUser && loadingProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there's no user AND the current path is NOT an AI tools path,
  // it means it's a protected (app) page. The useEffect above handles redirection.
  // Returning null here can prevent a flash of the layout for protected routes before redirect.
  // For AI tools paths, this condition will be false, allowing layout rendering for anonymous users.
  const isAiToolsPathForRenderCheck = pathname.startsWith('/ai-tools');
  if (!currentUser && !isAiToolsPathForRenderCheck) {
    // This implies it's a protected route like /dashboard, /settings, etc., and user is not logged in.
    // The useEffect should have initiated a redirect.
    return null; 
  }


  const handleLogout = async () => {
    await logOut();
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
              <Link href="/" className="flex items-center gap-2 md:hidden">
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
                        <AvatarImage src={currentUser.photoURL || ""} alt="User avatar" /> 
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
    