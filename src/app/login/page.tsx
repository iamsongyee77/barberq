'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, initiateEmailSignIn, initiateEmailSignUp, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Scissors, Mail, Lock, Database } from 'lucide-react';
import { seedData } from "@/app/actions";
import { doc, getDoc } from 'firebase/firestore';


import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { useUser } from '@/firebase';

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signUpSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading || !user || !firestore) return;

    const checkUserRoleAndRedirect = async () => {
        if (user.email === 'admin@example.com') {
            router.push('/admin/dashboard');
            return;
        }

        const barberRef = doc(firestore, 'barbers', user.uid);
        const barberSnap = await getDoc(barberRef);
        if (barberSnap.exists()) {
            router.push('/admin/timeline'); // Barbers default to their timeline
            return;
        }

        // Default redirect for customers
        router.push('/profile');
    };

    checkUserRoleAndRedirect();
  }, [user, isUserLoading, router, firestore]);

  const signInForm = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSignInSubmit = async (values: z.infer<typeof signInSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, values.email, values.password);
      toast({
        title: 'Signed In!',
        description: 'You will be redirected shortly.',
      });
      // The useEffect will handle the redirect
    } catch (error: any) {
      console.error('Sign In Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description:
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit = async (values: z.infer<typeof signUpSchema>) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await initiateEmailSignUp(auth, values.email, values.password);
      toast({
        title: 'Sign Up Successful!',
        description: 'Redirecting you to your new profile.',
      });
      // The useEffect will handle the redirect
    } catch (error: any) {
      console.error('Sign Up Error:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already in use.'
            : error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

   const handleSeedData = async () => {
    setIsSeeding(true);
    const response = await seedData();
    if (response.success) {
      toast({
        title: "Database Seeded!",
        description: response.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Seeding Failed",
        description: response.error,
      });
    }
    setIsSeeding(false);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <Tabs defaultValue="sign-in" className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <Scissors className="h-12 w-12 text-primary" />
          </div>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sign-in">Sign In</TabsTrigger>
            <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
          </TabsList>

          {/* Sign In Tab */}
          <TabsContent value="sign-in">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Welcome Back!
                </CardTitle>
                <CardDescription>
                  Sign in to your account to manage your appointments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signInForm}>
                  <form
                    onSubmit={signInForm.handleSubmit(onSignInSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={signInForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="you@example.com"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signInForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sign Up Tab */}
          <TabsContent value="sign-up">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  Create an Account
                </CardTitle>
                <CardDescription>
                  Join us to start booking your appointments with ease.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form
                    onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={signUpForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="you@example.com"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Create a password"
                                {...field}
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signUpForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="password"
                                placeholder="Confirm your password"
                                {...field}
                                className="pl-10"
                              />
                            </div>
FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {process.env.NODE_ENV === "development" && (
            <Card className="mt-8 w-full max-w-md">
                <CardHeader>
                    <CardTitle>Dev Tools</CardTitle>
                    <CardDescription>For development purposes only. Click to populate the Firestore database with initial data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={handleSeedData} disabled={isSeeding} className="w-full">
                        <Database className="mr-2 h-4 w-4" />
                        {isSeeding ? 'Seeding...' : 'Seed Database'}
                    </Button>
                </CardContent>
            </Card>
        )}

      </main>
      <Footer />
    </div>
  );
}
