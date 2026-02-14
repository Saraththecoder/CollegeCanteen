import React, { useState } from 'react';
import { Copy, Check, AlertCircle, Terminal } from 'lucide-react';
import { APP_NAME } from '../constants';

export const FirebaseSetup: React.FC = () => {
  const domain = window.location.hostname;
  const [copied, setCopied] = useState(false);

  const copyDomain = () => {
    navigator.clipboard.writeText(domain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-noir">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-noir p-6 text-white text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">{APP_NAME} Setup</h1>
          <p className="text-gray-300 text-sm">Connect your Firebase project to get started</p>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Step 1: Create Project */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">1</div>
            <div>
              <h3 className="font-bold text-lg mb-1">Create Firebase Project</h3>
              <p className="text-gray-600 text-sm mb-2">
                Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">Firebase Console</a> and create a new project.
              </p>
            </div>
          </div>

          {/* Step 2: Whitelist Domain */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">2</div>
            <div className="w-full">
              <h3 className="font-bold text-lg mb-1">Authorize This Domain</h3>
              <p className="text-gray-600 text-sm mb-3">
                Navigate to <strong>Authentication</strong> &rarr; <strong>Settings</strong> &rarr; <strong>Authorized Domains</strong> and add the following domain:
              </p>
              
              <div className="flex items-center gap-2 bg-gray-900 text-white p-3 rounded-lg font-mono text-sm">
                <span className="flex-grow truncate">{domain}</span>
                <button 
                  onClick={copyDomain}
                  className="p-2 hover:bg-gray-700 rounded-md transition-colors text-gray-300 hover:text-white"
                  title="Copy domain"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                This fixes the "auth/unauthorized-domain" error.
              </p>
            </div>
          </div>

          {/* Step 3: Add API Keys */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500">3</div>
            <div className="w-full">
              <h3 className="font-bold text-lg mb-1">Configure API Keys</h3>
              <p className="text-gray-600 text-sm mb-3">
                Go to <strong>Project Settings</strong>, scroll to "Your apps", and copy the config object.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                <strong>Action Required:</strong> Open <code className="bg-white px-1 py-0.5 rounded border border-yellow-300 mx-1">firebase.ts</code> and replace the <code className="font-bold">firebaseConfig</code> object with your own credentials.
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                   <Terminal className="w-4 h-4 mr-2" />
                   Or set Environment Variables
                </div>
                <code className="block text-xs text-gray-500 break-all font-mono">
                  NEXT_PUBLIC_FIREBASE_API_KEY=...<br/>
                  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...<br/>
                  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
                </code>
              </div>
            </div>
          </div>

        </div>

        <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 border-t border-gray-200">
          Once configured, this screen will disappear automatically.
        </div>
      </div>
    </div>
  );
};