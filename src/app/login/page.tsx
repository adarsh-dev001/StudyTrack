
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Kept for consistency, though FormLabel is used
import { BookOpenText, Loader2, Mail, Lock, Eye, EyeOff, X } from 'lucide-react'; // Added X
import { useAuth } from '@/contexts/auth-context';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import React, { useState } from 'react';
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { handleSubmit, control, formState: { isSubmitting } } = form;

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    await signIn(data.email, data.password);
    // Redirection is handled within signIn on success
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-purple-100 dark:from-sky-900 dark:via-indigo-950 dark:to-purple-900 p-4">
      <Card className="w-full max-w-md shadow-xl rounded-lg relative">
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive z-10 h-7 w-7 sm:h-8 sm:w-8"
            aria-label="Close"
        >
            <X className="h-5 w-5" />
        </Button>
        <CardHeader className="text-center p-6 pt-8 sm:pt-10"> {/* Added padding top for close button space */}
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <BookOpenText className="h-8 w-8 text-primary" />
            <span className="font-headline text-3xl font-bold text-foreground">StudyTrack</span>
          </Link>
          <CardTitle className="font-headline text-2xl">👋 Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your productivity journey.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 p-6">
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email Address</FormLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input id="email" type="email" placeholder="you@example.com" {...field} className="pl-10" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <Link href="#" className="text-xs text-primary hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <FormControl>
                        <Input 
                          id="password" 
                          type={showPassword ? "text" : "password"} 
                          {...field} 
                          className="pl-10 pr-10"
                          placeholder="Enter your password"
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                        onClick={togglePasswordVisibility}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4 p-6">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary to-sky-500 hover:from-primary/90 hover:to-sky-500/90 dark:to-sky-600 dark:hover:to-sky-700 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 py-3 text-base" 
                disabled={isSubmitting || authLoading}
              >
                {isSubmitting || authLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Login'}
              </Button>
              
              <div className="relative my-2">
                <Separator className="absolute left-0 top-1/2 w-full -translate-y-1/2" />
                <span className="relative z-10 bg-card px-2 text-xs text-muted-foreground">OR</span>
              </div>

              {/* Placeholder for Social Logins */}
              <div className="space-y-2 w-full text-center">
                <p className="text-xs text-muted-foreground">Social logins (Google, GitHub) coming soon!</p>
                {/* 
                Example of how they might look:
                <Button variant="outline" className="w-full" disabled>
                  <Github className="mr-2 h-4 w-4" /> Continue with GitHub
                </Button>
                <Button variant="outline" className="w-full" disabled>
                  <Chrome className="mr-2 h-4 w-4" /> Continue with Google
                </Button> 
                */}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-2">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign Up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
