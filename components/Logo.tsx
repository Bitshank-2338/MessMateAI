import React from 'react';
import { Leaf, Brain, Wifi, Utensils } from 'lucide-react';

export const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-full border border-green-100 shadow-sm overflow-hidden`}>
    <div className="absolute left-[15%] bottom-[15%]">
       <Utensils className="w-[50%] h-[50%] text-orange-500" />
    </div>
    <div className="absolute left-[5%] bottom-[35%]">
       <Leaf className="w-[30%] h-[30%] text-green-500 transform -rotate-12" />
    </div>
    <div className="absolute right-[15%] top-[30%]">
       <Brain className="w-[50%] h-[50%] text-orange-400" />
    </div>
    <div className="absolute right-[20%] top-[10%]">
       <Wifi className="w-[30%] h-[30%] text-blue-500" />
    </div>
  </div>
);