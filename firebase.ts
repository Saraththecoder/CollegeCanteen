import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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

// --- SECURITY: APP CHECK (reCAPTCHA v3) ---
// To get your free site key:
// 1. Go to https://www.google.com/recaptcha/admin/create
// 2. Set a label (e.g., "Canteen App")
// 3. Select "reCAPTCHA v3" as the reCAPTCHA type
// 4. Add your domains (e.g., localhost, your-app.web.app)
// 5. Submit and copy the "Site Key" provided.
// 6. Add it to your .env file as: VITE_RECAPTCHA_SITE_KEY=your_site_key_here
// Note: Do NOT enforce App Check in the Firebase Console until you have tested 
// and confirmed this works in production, or you will lock yourself out!

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  // @ts-ignore
  const siteKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_RECAPTCHA_SITE_KEY : ""; 
  if (siteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log("Security: App Check Activated");
  }
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);