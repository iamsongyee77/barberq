'use client';

import { useEffect, useState }from 'react';
import { useAuth, initiateLineSignIn, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LineLoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isInitiated, setIsInitiated] = useState(false);

  useEffect(() => {
    // If auth is not ready, or user is loading, or we already initiated, do nothing.
    if (!auth || isUserLoading || isInitiated) {
      return;
    }
    
    // If user is already logged in, redirect them away.
    if (user) {
      router.replace('/profile');
      return;
    }

    // Trigger the LINE login process.
    setIsInitiated(true);
    initiateLineSignIn(auth).catch(error => {
      console.error('LINE Sign In Error:', error);
      toast({
        variant: 'destructive',
        title: 'LINE Sign In Failed',
        description: error.message || 'Could not redirect to LINE login.',
      });
      // Redirect back to the main login page on failure
      router.replace('/login');
    });
  }, [auth, user, isUserLoading, router, toast, isInitiated]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-xl font-semibold">Connecting to LINE</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the LINE login page...</p>
      </div>
    </div>
  );
}
