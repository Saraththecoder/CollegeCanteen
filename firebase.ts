import * as firebaseApp from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Helper to handle environment variables in different build environments
const getEnvVar = (key: string) => {
  // Check for Vite style
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) { }

  // Check for Next.js / Create React App style
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`NEXT_PUBLIC_${key}`] || process.env[`REACT_APP_${key}`];
    }
  } catch (e) { }

  return "";
};

const firebaseConfig = {
  apiKey: getEnvVar("FIREBASE_API_KEY"),
  authDomain: getEnvVar("FIREBASE_AUTH_DOMAIN"),
  projectId: getEnvVar("FIREBASE_PROJECT_ID"),
  storageBucket: getEnvVar("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnvVar("FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnvVar("FIREBASE_APP_ID")
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: firebaseApp.FirebaseApp;

try {
  // Only initialize if config is present
  if (isFirebaseConfigured) {
    if (firebaseApp.getApps().length === 0) {
      app = firebaseApp.initializeApp(firebaseConfig);
    } else {
      app = firebaseApp.getApp();
    }
  } else {
    console.warn("Firebase credentials missing. Please check your .env file.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
  throw error;
}

// --- SECURITY: APP CHECK ---
// To enable strict security (preventing bots and scripts from accessing your DB),
// 1. Go to Firebase Console -> App Check
// 2. Register your site with reCAPTCHA v3
// 3. Add the key below and uncomment the code.

/*
if (typeof window !== 'undefined' && isFirebaseConfigured) {
  // Replace "YOUR_RECAPTCHA_V3_SITE_KEY" with the key from Google reCAPTCHA Admin
  const siteKey = getEnvVar("RECAPTCHA_SITE_KEY"); 
  if (siteKey) {
    // import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
    // initializeAppCheck(app!, {
    //   provider: new ReCaptchaV3Provider(siteKey),
    //   isTokenAutoRefreshEnabled: true
    // });
    console.log("Security: App Check Activated");
  }
}
*/

// Export auth/db only if initialized, otherwise handle gracefully in app
export const auth = app! ? getAuth(app) : {} as any;
export const googleProvider = new GoogleAuthProvider();
export const db = app! ? getFirestore(app) : {} as any;