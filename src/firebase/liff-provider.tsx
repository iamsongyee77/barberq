'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import type { Liff } from '@liff/core';

const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

interface LiffContextType {
  liff: Liff | null;
  isLiffLoading: boolean;
  liffError: Error | null;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const useLiff = () => {
  const context = useContext(LiffContext);
  if (!context) {
    throw new Error('useLiff must be used within a LiffProvider');
  }
  return context;
};

export const LiffProvider = ({ children }: { children: React.ReactNode }) => {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState<Error | null>(null);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (isUserLoading || user) {
        // If Firebase is already checking auth or user is already logged in, do nothing.
        setIsLiffLoading(false);
        return;
    }
    
    if (!liffId) {
        console.warn("NEXT_PUBLIC_LIFF_ID is not set. LIFF auto-login will be skipped.");
        setIsLiffLoading(false);
        return;
    }

    const initLiff = async () => {
      try {
        const { default: liff } = await import('@liff/core');
        await liff.init({ liffId });
        setLiffObject(liff);

        if (liff.isInClient() && !liff.isLoggedIn()) {
           // Silently log in if in LINE's browser and not already logged in via LIFF
           // This prepares LIFF to be able to get an ID token
           liff.login();
        }

        if (liff.isLoggedIn()) {
          const idToken = liff.getIDToken();
          if (idToken) {
            // We have a token from LIFF, let's try to sign into Firebase with it.
            const response = await fetch('/api/auth/line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get Firebase token from backend.');
            }

            const { firebaseToken } = await response.json();
            await signInWithCustomToken(auth, firebaseToken);
            // Firebase onAuthStateChanged will handle the rest
          }
        }
      } catch (error) {
        console.error('LIFF initialization or auto-login failed:', error);
        setLiffError(error instanceof Error ? error : new Error('An unknown LIFF error occurred'));
      } finally {
        setIsLiffLoading(false);
      }
    };

    initLiff();
  }, [user, isUserLoading, auth]);

  const value = { liff: liffObject, isLiffLoading, liffError };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};
