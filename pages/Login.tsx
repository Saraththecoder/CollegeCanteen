import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import { AlertTriangle } from 'lucide-react';
import { checkRateLimit, resetRateLimit, validatePassword, validateEmail } from '../utils/security';
import { UserRole } from '../types';

type Tab = 'login' | 'signup';

export const Login: React.FC = () => {
  const { user, signInWithGoogle, loginWithEmail, signupWithEmail, loading, error: authError } = useAuth();
  // We rely on the reactive redirect below.
  const [activeTab, setActiveTab] = useState<Tab>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  if (loading) return null;
  
  // Automatic Redirect based on Role
  if (user) {
    return <Navigate to={user.role === UserRole.ADMIN ? ROUTES.ADMIN : ROUTES.HOME} replace />;
  }

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // --- Validation & Security Checks ---

    // 1. Rate Limiting for Login
    if (activeTab === 'login') {
      const rateLimit = checkRateLimit(email);
      if (!rateLimit.allowed) {
        setLocalError(`Too many attempts. Please try again in ${rateLimit.waitTimeMinutes} minutes.`);
        return;
      }
    }

    // 2. Email Validation
    if (!validateEmail(email)) {
       setLocalError("Please enter a valid email address.");
       return;
    }

    // 3. Password Validation (Strict check for signup)
    if (activeTab === 'signup') {
      const passValidation = validatePassword(password);
      if (!passValidation.isValid) {
        setLocalError(passValidation.message || "Invalid password.");
        return;
      }
      if (!name.trim()) {
        setLocalError("Name is required");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (activeTab === 'signup') {
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
        // Successful login, reset rate limit
        resetRateLimit(email);
      }
      // We do not manually navigate here. 
      // Successful auth will update the `user` object in context, triggering the redirect above.
    } catch (err: any) {
      // Don't reveal exactly why it failed to prevent enumeration (handled generically in AuthContext for user-not-found/wrong-password)
      setLocalError(err.message || "Action failed");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    try {
      await signInWithGoogle();
      // Redirect handled by reactive `user` check
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white dark:bg-black p-8 shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-black dark:text-white mb-2">
            {activeTab === 'signup' ? 'Join Us' : 'Welcome Back'}
          </h1>
          <p className="text-gray-500 font-light">
            {activeTab === 'signup' ? 'Create your account' : 'Access your account'}
          </p>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'login' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Login
          </button>
          <button
            onClick={() => handleTabChange('signup')}
            className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'signup' ? 'text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            Register
          </button>
        </div>

        <div>
          {displayError && (
            <div className="mb-8 p-4 border border-red-200 dark:border-white flex items-start text-left bg-red-50 dark:bg-gray-900">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-white mr-3 flex-shrink-0" />
              <p className="text-sm font-medium text-red-600 dark:text-white">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white text-black dark:text-white outline-none transition-colors"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white text-black dark:text-white outline-none transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white text-black dark:text-white outline-none transition-colors"
                required
                minLength={6}
              />
              {activeTab === 'signup' && (
                <p className="text-[10px] text-gray-500">Min 8 chars, 1 uppercase, 1 lowercase, 1 number.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Processing...' : activeTab === 'signup' ? 'Create Account' : 'Enter'}
            </button>
          </form>

          <div className="relative my-10 text-center">
            <span className="bg-white dark:bg-black px-4 text-xs text-gray-400 uppercase tracking-widest">or</span>
            <div className="absolute top-1/2 left-0 w-full border-t border-gray-200 dark:border-gray-800 -z-10"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 dark:border-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white hover:text-black dark:hover:text-black transition-all text-black dark:text-white"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full" />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
};