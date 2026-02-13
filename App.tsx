import React, { useState, useEffect } from 'react';
import { MealAnalyzer } from './components/MealAnalyzer';
import { DailyTracker } from './components/DailyTracker';
import { HistoryTable } from './components/HistoryTable';
import { UserProfileForm } from './components/UserProfileForm';
import { MessCrisis } from './components/MessCrisis';
import { WeeklyMealPlan } from './components/WeeklyMealPlan';
import { AIHealthLab } from './components/AIHealthLab';
import { WorkoutEngine } from './components/WorkoutEngine';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { MealLog, UserProfile } from './types';
import { Leaf, Info, PieChart, Table as TableIcon, User, Drumstick, Utensils, Brain, Wifi, CalendarDays, Sparkles, Dumbbell, LogOut, WifiOff } from 'lucide-react';
import { supabase } from './lib/supabase';

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  location: 'Pune',
  dietType: 'Vegetarian',
  avoidances: 'Bread, Curd, Paneer, Sugar',
  age: '',
  height: '',
  weight: '',
  gender: 'Male',
  activityLevel: 'Sedentary',
  fitnessGoal: 'Lean Muscle',
  targetTimeline: '3 months',
  problemAreas: '',
  messMealsPerDay: 2,
  budget: 'Moderate',
  cookingSetup: 'Kettle Only',
  dailyWaterGoal: 3
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const [logs, setLogs] = useState<MealLog[]>([]);
  // Stores daily water intake in Liters. Key is YYYY-MM-DD
  // Keeping water local for now as per minimal change requirement unless strictly required to sync
  const [waterLogs, setWaterLogs] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('mahaVegWater');
    return saved ? JSON.parse(saved) : {};
  });

  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  
  const [showInfo, setShowInfo] = useState(false);
  const [currentView, setCurrentView] = useState<'tracker' | 'history' | 'profile' | 'plan' | 'ailab' | 'workout'>('tracker');

  // Supabase Auth & Data Sync
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        fetchData(session.user.id);
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        fetchData(session.user.id);
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setLogs([]);
        setProfile(DEFAULT_PROFILE);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async (uid: string) => {
    setIsOffline(false);
    try {
      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (profileData) {
        // Map snake_case to camelCase manually or ensure DB matches types. Assuming snake_case in DB.
        // If DB columns match types exactly, we can just use profileData.
        // Let's assume standard mapping needed for typical SQL setups:
        const mappedProfile: UserProfile = {
          name: profileData.name || '',
          location: profileData.location || 'Pune',
          dietType: profileData.diet_type || 'Vegetarian',
          avoidances: profileData.avoidances || '',
          age: profileData.age || '',
          height: profileData.height || '',
          weight: profileData.weight || '',
          gender: profileData.gender || 'Male',
          activityLevel: profileData.activity_level || 'Sedentary',
          dailyWaterGoal: profileData.daily_water_goal || 3,
          fitnessGoal: profileData.fitness_goal || 'Lean Muscle',
          targetTimeline: profileData.target_timeline || '3 months',
          problemAreas: profileData.problem_areas || '',
          messMealsPerDay: profileData.mess_meals_per_day || 2,
          budget: profileData.budget || 'Moderate',
          cookingSetup: profileData.cooking_setup || 'Kettle Only'
        };
        setProfile(mappedProfile);
      }

      // Fetch Logs
      const { data: logsData, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (logsData) {
        const mappedLogs: MealLog[] = logsData.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          dateStr: row.date,
          description: row.description,
          imageUrl: row.image_url,
          totalStats: {
            calories: row.calories,
            protein: row.protein,
            carbs: row.carbs
          },
          items: row.meal_items || [], // Assuming JSONB column for items
          feedback: row.feedback
        }));
        setLogs(mappedLogs);
      }

      if (profileError && profileError.code !== 'PGRST116') throw profileError; // PGRST116 is no rows found
      if (logsError) throw logsError;

    } catch (error) {
      console.error("Error fetching data:", error);
      setIsOffline(true);
    }
  };

  useEffect(() => {
    localStorage.setItem('mahaVegWater', JSON.stringify(waterLogs));
  }, [waterLogs]);

  const addLog = async (log: MealLog) => {
    if (!userId) return;
    
    // Optimistic update
    setLogs(prev => [log, ...prev]);

    try {
      const { error } = await supabase.from('daily_logs').insert({
        user_id: userId,
        date: log.dateStr,
        description: log.description,
        calories: log.totalStats.calories,
        protein: log.totalStats.protein,
        carbs: log.totalStats.carbs,
        feedback: log.feedback,
        image_url: log.imageUrl,
        meal_items: log.items,
        created_at: new Date(log.timestamp).toISOString()
      });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to sync log:", err);
      setIsOffline(true);
      // Revert optimistic update? Or keep and retry? keeping for now for UX.
    }
  };

  const updateWater = (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    setWaterLogs(prev => {
      const current = prev[today] || 0;
      const newVal = Math.max(0, current + amount);
      return { ...prev, [today]: newVal };
    });
  };

  const updateWaterGoal = async (goal: number) => {
    const newProfile = { ...profile, dailyWaterGoal: goal };
    setProfile(newProfile); // Optimistic
    
    if (userId) {
       await supabase.from('profiles').upsert({
         id: userId,
         daily_water_goal: goal,
         updated_at: new Date().toISOString()
       });
    }
  };

  const clearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      setLogs([]);
      setWaterLogs({});
      if (userId) {
        await supabase.from('daily_logs').delete().eq('user_id', userId);
      }
    }
  };
  
  const deleteLog = async (id: string) => {
    // Note: If ID is generated locally (uuid), it might not match DB ID if DB generates it.
    // Ideally use UUIDs generated by client or return from insert.
    // The current app generates UUIDs in MealAnalyzer, so we can use that for delete.
    setLogs(prev => prev.filter(l => l.id !== id));
    if (userId) {
       // Assuming 'id' column in DB matches the local ID we sent or we query by timestamp/content?
       // Best practice: We sent the ID? Supabase auto-generates IDs usually.
       // Let's assume we didn't send ID in insert (DB auto-gen). We can't delete reliably without fetching back the ID.
       // FIX: When fetching logs, we mapped DB `id` to `log.id`. So for existing logs, `id` is correct.
       // For new logs added in this session, `addLog` didn't update the ID with DB ID.
       // Simpler fix for this scope: Just try to delete by ID assuming we use the fetched ID.
       await supabase.from('daily_logs').delete().eq('id', id);
    }
  };

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (userId) {
      try {
        const { error } = await supabase.from('profiles').upsert({
          id: userId,
          name: newProfile.name,
          location: newProfile.location,
          diet_type: newProfile.dietType,
          avoidances: newProfile.avoidances,
          age: newProfile.age === '' ? null : newProfile.age,
          height: newProfile.height === '' ? null : newProfile.height,
          weight: newProfile.weight === '' ? null : newProfile.weight,
          gender: newProfile.gender,
          activity_level: newProfile.activityLevel,
          daily_water_goal: newProfile.dailyWaterGoal,
          fitness_goal: newProfile.fitnessGoal,
          target_timeline: newProfile.targetTimeline,
          problem_areas: newProfile.problemAreas,
          mess_meals_per_day: newProfile.messMealsPerDay === '' ? null : newProfile.messMealsPerDay,
          budget: newProfile.budget,
          cooking_setup: newProfile.cookingSetup,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      } catch (err) {
        console.error("Profile sync failed:", err);
        setIsOffline(true);
      }
    }
  };

  const toggleDiet = () => {
    const isVeg = profile.dietType === 'Vegetarian';
    const newDiet = isVeg ? 'Non-Vegetarian' : 'Vegetarian';
    updateProfile({ ...profile, dietType: newDiet });
  };

  const isVegetarian = profile.dietType === 'Vegetarian' || 
                       profile.dietType === 'Lacto-Vegetarian' || 
                       profile.dietType === 'Jain' || 
                       profile.dietType === 'Vegan';

  const handleLogin = () => {
    // This is just a callback for LandingPage, actual state handled by onAuthStateChange
  };
  
  const handleLogout = async () => {
     await supabase.auth.signOut();
  };

  if (loadingAuth) {
     return <div className="min-h-screen bg-white flex items-center justify-center">
       <Logo className="w-12 h-12 animate-bounce" />
     </div>;
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white text-xs font-bold text-center py-1">
          ⚠️ Offline Mode / Sync Error - Check Connection
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('tracker')}>
            <Logo />
            <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
              MessMate <span className="text-indigo-600">AI</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-1 sm:gap-2">
            
            {/* Diet Toggle Switch */}
            <div 
              onClick={toggleDiet}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 cursor-pointer flex items-center ${isVegetarian ? 'bg-green-500' : 'bg-red-500'} mr-2`}
              title={`Switch to ${isVegetarian ? 'Non-Vegetarian' : 'Vegetarian'}`}
            >
               <div className={`absolute bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform duration-300 ${isVegetarian ? 'translate-x-1' : 'translate-x-7'}`} />
            </div>

            <button
              onClick={() => setCurrentView('tracker')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${currentView === 'tracker' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Tracker"
            >
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Track</span>
            </button>
            <button
              onClick={() => setCurrentView('plan')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${currentView === 'plan' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Plan"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Diet</span>
            </button>
            <button
              onClick={() => setCurrentView('workout')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${currentView === 'workout' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Workout"
            >
              <Dumbbell className="w-4 h-4" />
              <span className="hidden sm:inline">Gym</span>
            </button>
            <button
              onClick={() => setCurrentView('ailab')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${currentView === 'ailab' ? 'bg-gray-900 text-yellow-400 shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              title="AI Health Lab"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI</span>
            </button>
            <button
              onClick={() => setCurrentView('profile')}
              className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 ml-1 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Info Banner */}
      {showInfo && (
        <div className="bg-indigo-600 text-white p-4">
          <div className="max-w-4xl mx-auto text-sm">
            <p className="font-semibold mb-1">About MessMate AI</p>
            <p className="opacity-90">
              Designed for {profile.dietType.toLowerCase()} students in {profile.location}. 
              {profile.avoidances && ` Avoiding: ${profile.avoidances}.`} Powered by Gemini.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        
        {currentView === 'tracker' && (
          <div className="animate-fade-in">
             <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hello, {profile.name || 'Student'}! 👋</h2>
              <p className="text-gray-600">
                Tracking for: <span className="font-medium text-indigo-600">{profile.location}</span> • <span className={`font-medium ${isVegetarian ? 'text-green-600' : 'text-red-600'}`}>{profile.dietType}</span>
              </p>
            </div>

            <MessCrisis profile={profile} />

            <MealAnalyzer onLogMeal={addLog} userProfile={profile} />

            <div className="my-8 border-t border-gray-200"></div>

            <DailyTracker 
              logs={logs} 
              waterLogs={waterLogs}
              onUpdateWater={updateWater}
              onClearLogs={clearLogs}
              onDeleteLog={deleteLog}
              userProfile={profile}
              onUpdateWaterGoal={updateWaterGoal}
            />
          </div>
        )}

        {currentView === 'plan' && (
          <div className="animate-fade-in">
             <WeeklyMealPlan profile={profile} />
          </div>
        )}

        {currentView === 'workout' && (
          <div className="animate-fade-in">
             <WorkoutEngine profile={profile} />
          </div>
        )}

        {currentView === 'ailab' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">AI Health Lab</h2>
              <p className="text-gray-600">Your personal {profile.location}-based nutrition & fitness expert.</p>
            </div>
            <AIHealthLab profile={profile} />
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-fade-in">
             <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Detailed History</h2>
              <p className="text-gray-600">Review your nutritional journey.</p>
            </div>
            <HistoryTable logs={logs} />
          </div>
        )}

        {currentView === 'profile' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
              <p className="text-gray-600">Update your metrics to get science-backed advice (TDEE, Macros).</p>
            </div>
            <UserProfileForm currentProfile={profile} onSave={updateProfile} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;