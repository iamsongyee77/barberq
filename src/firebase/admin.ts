
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';

// IMPORTANT: Do not hardcode service account credentials in your code.
// This setup is designed to work with environment variables,
// especially in a secure server environment like Firebase App Hosting.

let adminApp: App;

export function initFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // When deployed to a Google Cloud environment (like App Hosting, Cloud Functions, Cloud Run),
  // the SDK can automatically discover the service account credentials if SERVICE_ACCOUNT is set.
  // For local development, it reads from the .env file.
  const serviceAccountEnv = process.env.SERVICE_ACCOUNT;

  if (serviceAccountEnv) {
    try {
      // The SERVICE_ACCOUNT from .env might be a string literal, so we parse it into a JSON object.
      const serviceAccount = JSON.parse(serviceAccountEnv);
       adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (e) {
      console.error('Failed to parse SERVICE_ACCOUNT environment variable. Make sure it is a valid JSON string.', e);
      throw new Error('Firebase Admin initialization failed due to invalid service account credentials.');
    }
  } else {
    // This fallback is for production environments where secrets are injected differently
    // or for local dev where GOOGLE_APPLICATION_CREDENTIALS might be set.
    console.log('Initializing Firebase Admin with default credentials (production or GOOGLE_APPLICATION_CREDENTIALS)...');
    adminApp = initializeApp();
  }

  return adminApp;
}
