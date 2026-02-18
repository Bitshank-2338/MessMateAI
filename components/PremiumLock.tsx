import React, { useState } from 'react';
import { Lock, Crown, Check, Loader2, ShieldCheck, CreditCard } from 'lucide-react';

interface PremiumLockProps {
  featureName: string;
  onUpgrade: () => Promise<void>;
}

export const PremiumLock: React.FC<PremiumLockProps> = ({ featureName, onUpgrade }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    // Simulate payment processing delay and redirect
    await new Promise(resolve => setTimeout(resolve, 2000));
    await onUpgrade();
    setLoading(false);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-indigo-900 text-white p-8 text-center shadow-xl border border-indigo-500/30 animate-fade-in">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-indigo-500 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-50px] left-[-50px] w-48 h-48 bg-purple-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-6 backdrop-blur-md border border-white/20 shadow-inner">
          <Lock className="w-8 h-8 text-indigo-300" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Unlock {featureName}</h2>
        <p className="text-indigo-200 mb-6 max-w-md">
          Your 15-day free trial has expired. Upgrade to MessMate Premium to regain full access to AI planning tools.
        </p>

        <div className="bg-white/5 rounded-xl p-6 w-full max-w-sm border border-white/10 mb-6">
          <div className="flex justify-between items-baseline mb-4 border-b border-white/10 pb-4">
             <span className="text-gray-300 font-medium">Premium Access</span>
             <span className="text-3xl font-bold text-white">₹249 <span className="text-xs font-normal text-gray-400">/ lifetime</span></span>
          </div>
          <ul className="space-y-3 text-left">
            <li className="flex items-center gap-3 text-sm text-indigo-100">
               <Check className="w-4 h-4 text-green-400 shrink-0" />
               Unlimited AI Weekly Meal Plans
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100">
               <Check className="w-4 h-4 text-green-400 shrink-0" />
               Custom Gym & Home Workout Splits
            </li>
            <li className="flex items-center gap-3 text-sm text-indigo-100">
               <Check className="w-4 h-4 text-green-400 shrink-0" />
               Support Development
            </li>
          </ul>
        </div>

        <div className="text-xs text-gray-400 mb-4 bg-black/20 px-3 py-2 rounded-lg max-w-sm">
           <p className="flex items-center justify-center gap-1.5 mb-1 font-semibold text-gray-300">
             <ShieldCheck className="w-3 h-3" /> Secure Payment Gateway
           </p>
           Once you click 'Pay Now', you will be taken to our secure payment page. 
           Supports <span className="text-white">UPI (GPay, PhonePe)</span>, <span className="text-white">Cards</span>, and <span className="text-white">Netbanking</span>.
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="group relative px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-yellow-500/20 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed w-full max-w-xs overflow-hidden"
        >
          {loading ? (
             <span className="flex items-center justify-center gap-2">
               <Loader2 className="w-5 h-5 animate-spin" />
               Processing...
             </span>
          ) : (
             <span className="flex items-center justify-center gap-2">
               <Crown className="w-5 h-5" />
               Pay ₹249 & Unlock
             </span>
          )}
          {/* Shine effect */}
          {!loading && <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-[shimmer_1.5s_infinite]"></div>}
        </button>
        
        <div className="mt-4 flex gap-3 text-gray-500 justify-center">
           <CreditCard className="w-4 h-4" />
           <span className="text-xs">GST Compliant Receipt provided on next page.</span>
        </div>
      </div>
    </div>
  );
};