'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { signInWithCustomToken, type Auth } from 'firebase/auth';
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

async function performSilentLiffLogin(auth: Auth): Promise<void> {
    const { default: liff } = await import('@liff/core');
    await liff.init({ liffId: liffId! });

    if (!liff.isLoggedIn()) {
        // Not logged in to LIFF, so we can't auto-login.
        // The user will need to click the login button.
        return;
    }

    // User is logged in to LIFF. Let's try to sign them into Firebase.
    const idToken = liff.getIDToken();
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
  const [isLiffLoading, setIsLiffLoading] = useState(true);
  const [liffError, setLiffError] = useState<Error | null>(null);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // If Firebase user is already loaded or we are in the process of loading, don't do anything yet.
    if (user || isUserLoading) {
        setIsLiffLoading(false);
        return;
    }

    if (!liffId) {
        console.warn("NEXT_PUBLIC_LIFF_ID is not set. LIFF auto-login will be skipped.");
        setIsLiffLoading(false);
        return;
    }

    const initLiffAndTryLogin = async () => {
      try {
        // We only attempt silent login. If it fails, the user can click the button.
        await performSilentLiffLogin(auth);
      } catch (error) {
        console.error('LIFF auto-login failed:', error);
        setLiffError(error instanceof Error ? error : new Error('An unknown LIFF error occurred'));
        // We don't rethrow here, because a failed auto-login is not a critical app error.
        // The user can still proceed to log in manually.
      } finally {
        setIsLiffLoading(false);
      }
    };

    initLiffAndTryLogin();
  }, [user, isUserLoading, auth]);

  const value = { liff: liffObject, isLiffLoading: isLiffLoading || isUserLoading, liffError };

  return <LiffContext.Provider value={value}>{children}</LiffContext.Provider>;
};
