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
  // the SDK can automatically discover the service account credentials.
  // For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
  const serviceAccountEnv = process.env.SERVICE_ACCOUNT;

  if (serviceAccountEnv) {
    try {
      const serviceAccount = JSON.parse(serviceAccountEnv);
       adminApp = initializeApp({
        credential: cert(serviceAccount)
      });
    } catch (e) {
      console.error('Failed to parse SERVICE_ACCOUNT environment variable.', e);
      throw new Error('Firebase Admin initialization failed due to invalid service account credentials.');
    }
  } else {
    console.log('Initializing Firebase Admin with default credentials...');
    // This will work in Google Cloud environments automatically.
    // For local dev, it requires `gcloud auth application-default login` or GOOGLE_APPLICATION_CREDENTIALS.
    adminApp = initializeApp();
  }

  return adminApp;
}
