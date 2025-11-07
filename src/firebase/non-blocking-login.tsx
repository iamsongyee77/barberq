'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance).catch(error => {
    // Although less common for anonymous sign-in, handling errors is good practice.
    // We'll create a generic error here as it's not a specific Firestore rule violation.
    console.error("Anonymous sign-in error:", error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password)
  .catch(error => {
      // This could be 'auth/email-already-in-use', etc.
      // We are not creating a FirestorePermissionError as this is an auth error.
      console.error("Sign-up error:", error);
      // Re-throw or handle as needed for UI feedback
      throw error;
  });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password)
    .catch(error => {
        // This could be 'auth/wrong-password', 'auth/user-not-found', etc.
        console.error("Sign-in error:", error);
        // Re-throw or handle as needed for UI feedback
        throw error;
    });
}
