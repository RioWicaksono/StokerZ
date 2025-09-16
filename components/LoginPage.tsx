import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../utils/supabase';
import { BoxIcon, LoadingIcon } from './icons/Icons';
import Footer from './Footer';
import { AuthError } from '@supabase/supabase-js';

interface LoginPageProps {
  // onLogin prop is no longer needed as App.tsx listens to auth state changes
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username) {
      setError('Username is required.');
      setIsLoading(false);
      return;
    }

    try {
      // Supabase Auth uses email for login. We instruct users to use their username
      // as the email when signing up via the app or dashboard.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (authError) {
         if (authError instanceof AuthError) {
          setError(authError.message);
        } else {
          throw authError;
        }
      } else if (authData.user) {
        // If login is successful, the onAuthStateChange listener in App.tsx
        // will handle fetching the profile and setting the user state.
        // No need to call onLogin here.
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError('An error occurred during login. Please check the console.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl">
          <div className="text-center">
              <div className="flex justify-center items-center mb-4">
                  <BoxIcon className="h-12 w-12 text-primary-500" />
                  <h1 className="text-4xl font-bold text-slate-800 ml-2">StockerZ</h1>
              </div>
            <h2 className="text-xl font-semibold text-slate-600">Warehouse Management System</h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="username" className="sr-only">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Username (as email)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password-input" className="sr-only">Password</label>
                <input
                  id="password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none rounded-none relative block w-full px-3 py-3 border border-slate-600 placeholder-slate-400 text-white bg-slate-700 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300"
              >
                {isLoading ? (
                  <LoadingIcon className="w-5 h-5 text-white animate-spin" />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;