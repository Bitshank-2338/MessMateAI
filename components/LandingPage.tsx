import React, { useState } from 'react';
import { Logo } from './Logo';
import { ArrowRight, Loader2, CheckCircle, ShieldCheck, Mail, Lock, AlertCircle } from 'lucide-react';
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