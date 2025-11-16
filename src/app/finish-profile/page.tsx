'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, User, Phone } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

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
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name is required.' }),
  lastName: z.string().min(2, { message: 'Last name is required.' }),
  phone: z.string().min(9, { message: 'A valid phone number is required.' }),
});

export default function FinishProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      // If not logged in, redirect to login page
      router.replace('/login');
    }
  }, [isUserLoading, user, router]);
  
   useEffect(() => {
    if (user?.displayName) {
        const nameParts = user.displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        form.setValue('firstName', firstName);
        if(lastName) {
           form.setValue('lastName', lastName);
        }
    }
  }, [user, form]);


  const onSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user || !firestore || !auth.currentUser) return;

    setIsLoading(true);
    try {
      const displayName = `${values.firstName} ${values.lastName}`.trim();

      // 1. Update Firebase Auth profile
      await updateProfile(auth.currentUser, { displayName });

      // 2. Create or update customer document in Firestore
      const customerDocRef = doc(firestore, "customers", user.uid);
      await setDoc(customerDocRef, {
        id: user.uid,
        name: displayName,
        email: user.email,
        phone: values.phone,
      }, { merge: true });

      toast({
        title: 'Profile Completed!',
        description: 'Welcome! You will now be redirected.',
      });

      // Redirect to the intended page, or home page as a fallback
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);

    } catch (error: any) {
      console.error('Profile Update Error:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not save your profile information.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your session...</p>
          </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Almost There!</CardTitle>
            <CardDescription>
              Please complete your profile to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="081-234-5678"
                            {...field}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save and Continue'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
