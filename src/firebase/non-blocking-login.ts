'use client';
import {
  Auth, 
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider,
  updateProfile,
  UserCredential,
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
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string): Promise<UserCredential> {
  return new Promise((resolve, reject) => {
    createUserWithEmailAndPassword(authInstance, email, password)
      .then((userCredential) => {
        // After creating the user, update their profile with the display name
        updateProfile(userCredential.user, { displayName: displayName })
          .then(() => resolve(userCredential));
      })
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

/** Initiate LINE sign-in via redirect using a custom OIDC provider. */
export function initiateLineSignIn(authInstance: Auth): Promise<void> {
    // Use the generic OAuthProvider with a custom provider ID for OIDC.
    // This ID 'oidc.line' must match the Provider ID you configure in the Firebase Console.
    const provider = new OAuthProvider('oidc.line');
    
    // Optional: LINE specific parameters can be added if needed.
    // For example, to prompt the user to add the bot as a friend.
    provider.setCustomParameters({
      bot_prompt: 'aggressive'
    });

    return signInWithRedirect(authInstance, provider);
}

/** Handle the result of a redirect-based sign-in (like LINE). */
export function handleRedirectSignIn(authInstance: Auth): Promise<void> {
    return new Promise((resolve, reject) => {
        getRedirectResult(authInstance)
            .then((result) => {
                if (result) {
                    // This gives you a LINE Access Token. You can use it to access the LINE API.
                    // const credential = OAuthProvider.credentialFromResult(result);
                    // const accessToken = credential.accessToken;
                    // const user = result.user;
                }
                resolve();
            })
            .catch((error) => {
                // Handle specific OAuth errors if necessary
                console.error("Redirect sign-in error:", error);
                reject(error);
            });
    });
}

    