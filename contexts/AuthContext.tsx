import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { 
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
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

// --- Simple Router Implementation (Replaces react-router-dom) ---
const RouterContext = createContext<{ path: string; navigate: (path: string, options?: { replace?: boolean }) => void }>({ path: '/', navigate: () => {} });

export const HashRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState(window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handleHashChange = () => {
      setPath(window.location.hash.slice(1) || '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((newPath: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      window.location.replace('#' + newPath);
    } else {
      window.location.hash = newPath;
    }
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};

export const useLocation = () => {
  const { path } = useContext(RouterContext);
  return { pathname: path };
};

export const useNavigate = () => {
  const { navigate } = useContext(RouterContext);
  return useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      window.history.go(to);
    } else {
      navigate(to, options);
    }
  }, [navigate]);
};

export const Link: React.FC<{ to: string; children: React.ReactNode; className?: string }> = ({ to, children, className }) => {
  return (
    <a href={`#${to}`} className={className}>
      {children}
    </a>
  );
};

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { path } = useContext(RouterContext);
  let matchedElement: React.ReactNode = null;

  React.Children.forEach(children, (child) => {
    if (matchedElement) return;
    if (React.isValidElement(child)) {
      const props = child.props as Record<string, any>;
      if (props.path === path) {
        matchedElement = props.element;
      }
    }
  });
  
  return <>{matchedElement}</>;
};

export const Route: React.FC<{ path: string; element: React.ReactNode }> = () => null;

export const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [to, replace, navigate]);
  return null;
};

// --- Auth Context ---

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

  // Session Timeout Logic (Security)
  useEffect(() => {
    if (!user) return;

    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    let timeoutId: any;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        signOut(auth);
        console.log("Session expired due to inactivity");
      }, SESSION_TIMEOUT);
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimeout));

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimeout));
    };
  }, [user]);

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
    } else if (err.code === 'auth/too-many-requests') {
      setError("Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or trying again later.");
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