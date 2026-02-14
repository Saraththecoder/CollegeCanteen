import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to handle environment variables in different build environments
const getEnvVar = (key: string, fallback: string = "") => {
  // Check for Vite style (if exposed via import.meta.env)
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
      // @ts-ignore
      return import.meta.env[`VITE_${key}`];
    }
  } catch (e) {
    // ignore
  }

  // Check for Next.js / Create React App style
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[`NEXT_PUBLIC_${key}`] || process.env[`REACT_APP_${key}`] || fallback;
    }
  } catch (e) {
    // ignore
  }

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

// Check if the app is using the dummy key
export const isFirebaseConfigured = firebaseConfig.apiKey !== "AIzaSyDummyKey";

// Initialize Firebase
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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);