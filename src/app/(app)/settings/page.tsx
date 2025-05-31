
'use client';

import React, { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { updateProfile } from 'firebase/auth'; // For future use
import { auth } from '@/lib/firebase'; // For future use


const settingsSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  // We'll handle password updates separately if needed
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { currentUser, loading: authLoading, signUp, signIn, logOut } = useAuth(); // signUp, signIn, logOut are not directly used here but part of context
  const { toast } = useToast();
  
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      fullName: '',
      email: '',
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting, dirtyFields } } = form;

  useEffect(() => {
    if (currentUser) {
      reset({
        fullName: currentUser.displayName || '',
        email: currentUser.email || '',
      });
    }
  }, [currentUser, reset]);

  const onSubmit: SubmitHandler<SettingsFormData> = async (data) => {
    if (!currentUser) {
      toast({ title: "Error", description: "No user logged in.", variant: "destructive" });
      return;
    }

    try {
      // Update Firebase Auth profile
      if (data.fullName !== currentUser.displayName) {
         await updateProfile(currentUser, { displayName: data.fullName });
      }
      // Email update requires re-authentication, typically handled in a more complex flow.
      // For now, we'll just show a success message for name update.
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been updated.',
      });
       // Re-fetch or update context if necessary, though onAuthStateChanged might handle it.
       // For displayName, we might need to manually refresh the context or user object.
       // This example simplifies and assumes onAuthStateChanged might pick it up or a page refresh would show it.
       
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };
  
  if (authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-0 mx-0 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account and application preferences.</p>
      </div>
      
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Profile Settings</h2>
            <p className="text-muted-foreground mb-6">Update your personal information.</p>
            
            <div className="space-y-4">
              <FormField
                control={control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="fullName">Full Name</FormLabel>
                    <FormControl>
                      <Input id="fullName" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email Address</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground pt-1">Email address cannot be changed here. Contact support for assistance.</p>
                  </FormItem>
                )}
              />
            </div>
             <Button type="submit" className="mt-6" disabled={isSubmitting || !dirtyFields.fullName}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>

       <div className="rounded-xl border bg-card text-card-foreground shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-2">Theme Settings</h2>
        <p className="text-muted-foreground mb-4">Customize the app appearance.</p>
         <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Dark Mode</span>
            {/* Basic toggle, full theme switching would require more setup */}
            <Switch id="dark-mode-toggle" disabled/> 
            <span className="text-xs text-muted-foreground"> (Theme switching coming soon)</span>
        </div>
      </div>
    </div>
  );
}
