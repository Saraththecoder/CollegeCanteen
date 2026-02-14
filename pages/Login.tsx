import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from '../contexts/AuthContext';
import { ROUTES, ADMIN_EMAIL } from '../constants';
import { AlertTriangle, Info } from 'lucide-react';

type Tab = 'login' | 'signup' | 'admin';

export const Login: React.FC = () => {
  const { user, signInWithGoogle, loginWithEmail, signupWithEmail, loading, error: authError } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  if (loading) return null;
  if (user) return <Navigate to={ROUTES.HOME} replace />;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setLocalError('');
    if (tab === 'admin') {
      setEmail(ADMIN_EMAIL);
    } else if (email === ADMIN_EMAIL) {
      setEmail('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (activeTab === 'signup') {
        if (!name) throw new Error("Name is required");
        await signupWithEmail(email, password, name);
      } else {
        await loginWithEmail(email, password);
      }
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setLocalError(err.message || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError('');
    try {
      await signInWithGoogle();
      navigate(ROUTES.HOME);
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-black">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold text-white mb-2">
            {activeTab === 'signup' ? 'Join Us' : activeTab === 'admin' ? 'Staff Portal' : 'Welcome Back'}
          </h1>
          <p className="text-gray-400 font-light">
            {activeTab === 'signup' ? 'Create your account' : activeTab === 'admin' ? 'Restricted access' : 'Access your account'}
          </p>
        </div>

        <div className="flex border-b border-gray-800 mb-8">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'login' ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Login
          </button>
          <button
            onClick={() => handleTabChange('signup')}
            className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'signup' ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Register
          </button>
          <button
            onClick={() => handleTabChange('admin')}
            className={`flex-1 pb-4 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'admin' ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}
          >
            Admin
          </button>
        </div>

        <div>
          {displayError && (
            <div className="mb-8 p-4 border border-white flex items-start text-left bg-gray-900">
              <AlertTriangle className="w-5 h-5 text-white mr-3 flex-shrink-0" />
              <p className="text-sm font-medium text-white">{displayError}</p>
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="mb-8 p-4 bg-gray-900 border border-gray-800 flex items-start text-left">
              <Info className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
              <div className="text-xs text-gray-400">
                <p>Register as <span className="font-mono font-bold text-white">{ADMIN_EMAIL}</span> in the "Sign Up" tab first if you haven't created the admin account yet.</p>
              </div>
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
                  className="w-full px-4 py-3 bg-black border border-gray-700 focus:border-white text-white outline-none transition-colors"
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
                className="w-full px-4 py-3 bg-black border border-gray-700 focus:border-white text-white outline-none transition-colors disabled:bg-gray-900 disabled:text-gray-600"
                required
                readOnly={activeTab === 'admin'}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 focus:border-white text-white outline-none transition-colors"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Processing...' : activeTab === 'signup' ? 'Create Account' : 'Enter'}
            </button>
          </form>

          {activeTab !== 'admin' && (
            <>
              <div className="relative my-10 text-center">
                <span className="bg-black px-4 text-xs text-gray-400 uppercase tracking-widest">or</span>
                <div className="absolute top-1/2 left-0 w-full border-t border-gray-800 -z-10"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 border border-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 bg-white rounded-full" />
                Continue with Google
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};