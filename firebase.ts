import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Helper to handle environment variables in different build environments
const getEnvVar = (key: string, fallback: string = "") => {
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
      return process.env[`NEXT_PUBLIC_${key}`] || process.env[`REACT_APP_${key}`] || fallback;
    }
  } catch (e) { }

  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar("FIREBASE_API_KEY", "AIzaSyBVy9hRvP7h7cwI-8is6JSqOgZI9LMdYhY"),
  authDomain: getEnvVar("FIREBASE_AUTH_DOMAIN", "studio-7053793264-2537e.firebaseapp.com"),
  projectId: getEnvVar("FIREBASE_PROJECT_ID", "studio-7053793264-2537e"),
  storageBucket: getEnvVar("FIREBASE_STORAGE_BUCKET", "studio-7053793264-2537e.firebasestorage.app"),
  messagingSenderId: getEnvVar("FIREBASE_MESSAGING_SENDER_ID", "85567793047"),
  appId: getEnvVar("FIREBASE_APP_ID", "1:85567793047:web:4ac0793148965d3e6746d2")
};

export const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyDummyKey";

let app: FirebaseApp;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
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
  const siteKey = getEnvVar("RECAPTCHA_SITE_KEY", ""); 
  if (siteKey) {
    // import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
    // initializeAppCheck(app, {
    //   provider: new ReCaptchaV3Provider(siteKey),
    //   isTokenAutoRefreshEnabled: true
    // });
    console.log("Security: App Check Activated");
  }
}
*/

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);