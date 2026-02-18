import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowRight, Loader2, CheckCircle, ShieldCheck, Mail, Lock, AlertCircle, Github } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'OAuth failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side - Visual / Hero */}
      <div className="flex-1 bg-gradient-to-br from-indigo-600 to-blue-800 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
           <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white"></div>
           <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8 opacity-90">
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
               <Logo className="w-8 h-8" />
             </div>
             <span className="font-bold tracking-wide">MESSMATE AI</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            The AI Engine for your <br />
            <span className="text-yellow-400">Student Gains.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-indigo-100 max-w-md leading-relaxed">
            Stop guessing your macros. Track mess food, analyze body stats, and get instant "Jugaad" recipes tailored for Maharashtra students.
          </p>
        </div>

        <div className="relative z-10 mt-12 md:mt-0 flex gap-4 text-sm font-medium opacity-80">
           <div className="flex items-center gap-2">
             <CheckCircle className="w-4 h-4 text-green-400" />
             <span>Mess Crisis Mode</span>
           </div>
           <div className="flex items-center gap-2">
             <CheckCircle className="w-4 h-4 text-green-400" />
             <span>Local Diet Logic</span>
           </div>
           <div className="flex items-center gap-2">
             <CheckCircle className="w-4 h-4 text-green-400" />
             <span>Offline First</span>
           </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          
          {/* Auth Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'login' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('signup')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                activeTab === 'signup' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'login' ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-gray-500">
              {activeTab === 'login' ? 'Login to sync your progress' : 'Create an account to start tracking'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3.5 px-4 rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (activeTab === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Social Login */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Github className="h-5 w-5 text-gray-900" />
                <span>GitHub</span>
              </button>
            </div>
          </div>

          <div className="my-8 flex items-center gap-4">
             <div className="h-px bg-gray-200 flex-1"></div>
             <span className="text-gray-400 text-xs font-medium uppercase">Secured by MessMate</span>
             <div className="h-px bg-gray-200 flex-1"></div>
          </div>

          <div className="flex gap-4 justify-center">
             <div className="text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600">
                   <ShieldCheck className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-500 font-medium">Privacy First</p>
             </div>
             
             {/* Quick Setup Button */}
             <div 
               className="text-center cursor-pointer group"
               onClick={() => setActiveTab('signup')}
             >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 transform group-hover:scale-110 shadow-sm group-hover:shadow-md">
                   <ArrowRight className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-500 font-medium group-hover:text-indigo-600 transition-colors">Quick Setup</p>
             </div>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-8 leading-normal">
            By continuing, you agree to our Terms of Service. <br/>
            We do not sell your personal health data.
          </p>
        </div>
      </div>
    </div>
  );
};