'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signInWithCustomToken, type Auth } from 'firebase/auth';
import type { Liff } from '@liff/core';

const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

interface LiffContextType {
  liff: Liff | null;
  isLiffLoading: boolean;
  isInClient: boolean;
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

async function performSilentLiffLogin(auth: Auth, liffInstance: Liff): Promise<void> {
    if (!liffInstance.isLoggedIn()) {
        // Not logged in to LIFF, so we can't auto-login.
        // The user will need to click the login button.
        return;
    }

    // User is logged in to LIFF. Let's try to sign them into Firebase.
    const idToken = liffInstance.getIDToken();
    if (!idToken) {
        // This can happen if the required scopes (openid, email, profile) are missing.
        throw new Error('Could not get ID token from LIFF. Please check scopes.');
    }

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
    // Firebase's onAuthStateChanged will now pick up the new user state.
}


export const LiffProvider = ({ children }: { children: React.ReactNode }) => {
  const [liffObject, setLiffObject] = useState<Liff | null>(null);
  const [isInClient, setIsInClient] = useState(false);
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState<Error | null>(null);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    if (!liffId) {
        console.warn("NEXT_PUBLIC_LIFF_ID is not set. LIFF features will be disabled.");
        setIsLiffLoading(false);
        return;
    }

    const initLiff = async () => {
      try {
        const { default: liff } = await import('@liff/core');
        await liff.init({ liffId });
        setLiffObject(liff);
        setIsInClient(liff.isInClient());

        // Attempt silent login only if not already logged into Firebase
        if (!user && liff.isLoggedIn()) {
          await performSilentLiffLogin(auth, liff);
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error);
        setLiffError(error instanceof Error ? error : new Error('An unknown LIFF error occurred'));
      } finally {
        setIsLiffLoading(false);
      }
    };

    initLiff();
    
  }, [auth, user]); // Rerun if auth or user changes

  const value = { 
    liff: liffObject, 
    isLiffLoading: isLiffLoading || isUserLoading, 
    isInClient,
    liffError 
  };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};
