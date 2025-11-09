'use client';

import React, { type ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase, handleRedirectSignIn } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isLoadingRedirect, setIsLoadingRedirect] = useState(true);

  const firebaseServices = React.useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    if (firebaseServices.auth) {
      handleRedirectSignIn(firebaseServices.auth)
        .catch(console.error)
        .finally(() => {
          setIsLoadingRedirect(false);
        });
    }
  }, [firebaseServices.auth]);


  if (isLoadingRedirect) {
      return (
         <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Signing in...</p>
            </div>
        </div>
      );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
