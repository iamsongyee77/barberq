'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

/** Initiate anonymous sign-in. Returns a promise that resolves on success or rejects on error. */
export function initiateAnonymousSignIn(authInstance: Auth): Promise<void> {
  return new Promise((resolve, reject) => {
    signInAnonymously(authInstance)
      .then(() => resolve())
      .catch(error => {
        console.error("Anonymous sign-in error:", error);
        reject(error);
      });
  });
}

/** Initiate email/password sign-up. Returns a promise that resolves on success or rejects on error. */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    createUserWithEmailAndPassword(authInstance, email, password)
      .then(() => resolve())
      .catch(error => {
        console.error("Sign-up error:", error);
        reject(error);
      });
  });
}

/** Initiate email/password sign-in. Returns a promise that resolves on success or rejects on error. */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    signInWithEmailAndPassword(authInstance, email, password)
      .then(() => resolve())
      .catch(error => {
        console.error("Sign-in error:", error);
        reject(error);
      });
  });
}
