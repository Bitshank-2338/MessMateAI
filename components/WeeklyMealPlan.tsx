import React, { useState } from 'react';
import { CalendarDays, ChefHat, Clock, RefreshCw, AlertCircle, Zap, Mic } from 'lucide-react';
import { DayPlan, UserProfile, MealPlanItem } from '../types';
import { generateWeeklyMealPlan } from '../services/gemini';
import { PremiumLock } from './PremiumLock';

interface WeeklyMealPlanProps {
  profile: UserProfile;
  onOpenLive?: () => void;
  hasAccess?: boolean;
  onUpgrade?: () => Promise<void>;
}

export const WeeklyMealPlan: React.FC<WeeklyMealPlanProps> = ({ 
  profile, 
  onOpenLive, 
  hasAccess = true, 
  onUpgrade = async () => {} 
}) => {
  const [plan, setPlan] = useState<DayPlan[]>(() => {
    try {
      const saved = localStorage.getItem('mahaVegMealPlan');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const newPlan = await generateWeeklyMealPlan(profile);
      setPlan(newPlan);
      localStorage.setItem('mahaVegMealPlan', JSON.stringify(newPlan));
    } catch (err) {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const MealCard = ({ title, item, colorClass }: { title: string, item?: MealPlanItem, colorClass: string }) => {
    if (!item) {
        return (
             <div className="bg-gray-50 rounded-xl p-5 border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 text-sm h-full min-h-[140px]">
                <ChefHat className="w-6 h-6 mb-2 opacity-20" />
                No {title} planned
            </div>
        );
    }

    return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition relative overflow-hidden group h-full">
      <div className={`absolute top-0 left-0 w-1 h-full ${colorClass}`}></div>
      <div className="flex justify-between items-start mb-2 pl-3">
        <div>
          <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">{title}</h4>
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">{item.name}</h3>
        </div>
        <div className="bg-gray-50 px-2 py-1 rounded-md text-xs font-medium text-gray-500 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {item.prepTime}
        </div>
      </div>
      
      <div className="pl-3 mb-3 flex gap-3 text-sm flex-wrap">
         <span className="text-gray-600"><strong>{item.calories}</strong> kcal</span>
         <span className="text-emerald-600"><strong>{item.protein}g</strong> Prot</span>
         <span className="text-amber-600"><strong>{item.carbs}g</strong> Carbs</span>
      </div>

      <div className="pl-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-600 italic flex items-start gap-2">
          <ChefHat className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
          {item.instructions}
        </p>
      </div>
    </div>
  )};

  if (!hasAccess) {
    return (
       <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Weekly Plan</h2>
              <p className="text-gray-600 text-sm">Tailored for: <span className="font-medium text-indigo-600">{profile.cookingSetup}</span></p>
            </div>
          </div>
          <PremiumLock featureName="Weekly Meal Planner" onUpgrade={onUpgrade} />
       </div>
    );
  }

  if (!plan.length && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-2xl border border-dashed border-gray-300">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
          <CalendarDays className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Meal Plan Yet</h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Generate a 7-day custom meal plan based on your {profile.cookingSetup} setup and {profile.dietType} diet.
        </p>
        <button
          onClick={handleGenerate}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
        >
          <Zap className="w-5 h-5" />
          Generate Weekly Plan
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-gray-800">Chef AI is cooking up your plan...</h3>
        <p className="text-gray-500 text-sm">Thinking heavily to optimize your macros.</p>
      </div>
    );
  }

  // Safe access to active day
  const activeDay = plan[activeDayIndex] || plan[0];
  
  // Guard clause if data is corrupt
  if (!activeDay || !activeDay.meals) {
     return (
        <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-gray-600 mb-4">Plan data is incomplete.</p>
            <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
                Regenerate Plan
            </button>
        </div>
     );
  }

  // Safe calculations
  const safeVal = (val: number | undefined) => val || 0;
  const meals = activeDay.meals;

  const totalCal = safeVal(meals.breakfast?.calories) + safeVal(meals.lunch?.calories) + safeVal(meals.snack?.calories) + safeVal(meals.dinner?.calories);
  const totalProt = safeVal(meals.breakfast?.protein) + safeVal(meals.lunch?.protein) + safeVal(meals.snack?.protein) + safeVal(meals.dinner?.protein);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Weekly Plan</h2>
          <p className="text-gray-600 text-sm">Tailored for: <span className="font-medium text-indigo-600">{profile.cookingSetup}</span></p>
        </div>
        <div className="flex gap-2">
            {onOpenLive && (
                <button
                onClick={onOpenLive}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-indigo-50 px-3 py-2 rounded-lg transition"
                >
                <Mic className="w-4 h-4" />
                Voice
                </button>
            )}
            <button
            onClick={handleGenerate}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 bg-indigo-50 px-3 py-2 rounded-lg transition"
            >
            <RefreshCw className="w-4 h-4" />
            Regenerate Plan
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Day Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-hide">
        {plan.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setActiveDayIndex(idx)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
              activeDayIndex === idx
                ? 'bg-gray-800 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {day.day}
          </button>
        ))}
      </div>

      {/* Meal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
        <MealCard title="Breakfast" item={meals.breakfast} colorClass="bg-orange-400" />
        <MealCard title="Lunch" item={meals.lunch} colorClass="bg-emerald-500" />
        <MealCard title="Evening Snack" item={meals.snack} colorClass="bg-yellow-400" />
        <MealCard title="Dinner" item={meals.dinner} colorClass="bg-indigo-500" />
      </div>

      {/* Daily Summary */}
      <div className="bg-indigo-900 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
        <span className="font-medium">Daily Target Estimate</span>
        <div className="flex gap-4 text-sm">
           <span>
             Cal: <span className="font-bold">
               {totalCal}
             </span>
           </span>
           <span className="text-emerald-300">
             Pro: <span className="font-bold">
               {totalProt}g
             </span>
           </span>
        </div>
      </div>
    </div>
  );
};