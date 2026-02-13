import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { ADMIN_EMAIL } from '../constants';
import { UserProfile, UserRole } from '../types';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Sync user to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          let role = UserRole.USER;
          if (firebaseUser.email === ADMIN_EMAIL) {
            role = UserRole.ADMIN;
          }

          // Define profile data
          // FIX: Use Timestamp.now() for local state to match UserProfile interface. 
          // serverTimestamp() is for writes only and returns a FieldValue, not a Timestamp.
          const profile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role,
            createdAt: userSnap.exists() ? userSnap.data().createdAt : Timestamp.now(),
          };

          // If new user (or just created via Auth), ensure doc exists
          if (!userSnap.exists()) {
            await setDoc(userRef, profile);
          }

          setUser(profile);
          setError(null);
        } catch (err: any) {
          console.error("Error syncing user profile:", err);
          // Don't block app usage, but log it
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleError = (err: any) => {
    console.error("Auth Error:", err.code, err.message);
    if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
      setError("Configuration Error: Invalid Firebase API Key.");
    } else if (err.code === 'auth/popup-closed-by-user') {
      setError("Sign in cancelled.");
    } else if (err.code === 'auth/unauthorized-domain') {
      setError(`Domain Unauthorized: Add '${window.location.hostname}' to Firebase Console > Auth > Settings > Authorized Domains.`);
    } else if (err.code === 'auth/email-already-in-use') {
      setError("This email is already registered. Please login.");
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      setError("Account not found or password incorrect. Please Sign Up if you are new.");
    } else {
      setError(err.message || "Authentication failed.");
    }
    throw err;
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      handleError(err);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      handleError(err);
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update Auth Profile
      await updateProfile(userCredential.user, {
        displayName: name
      });
      // Trigger the onAuthStateChanged listener to handle Firestore sync
    } catch (err: any) {
      handleError(err);
    }
  };

  const logout = () => signOut(auth);

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, loginWithEmail, signupWithEmail, logout, isAdmin, error }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};