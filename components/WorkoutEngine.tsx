import React, { useState, useRef } from 'react';
import { Dumbbell, Home, Zap, Camera, RefreshCw, CheckCircle, Brain, Info, Upload, Mic } from 'lucide-react';
import { UserProfile, WorkoutSession, WorkoutLocation, PhysiqueAnalysis } from '../types';
import { generateWorkoutPlan, analyzePhysiqueDeep } from '../services/gemini';
import { PremiumLock } from './PremiumLock';

interface WorkoutEngineProps {
  profile: UserProfile;
  onOpenLive?: () => void;
  hasAccess?: boolean;
  onUpgrade?: () => Promise<void>;
}

const ExerciseCard: React.FC<{ exercise: any; index: number }> = ({ exercise, index }) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 transition group">
    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mt-1">
      {index + 1}
    </div>
    <div>
      <h4 className="font-bold text-gray-800">{exercise.name}</h4>
      <div className="flex gap-3 text-xs text-gray-500 mt-1">
        <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">{exercise.sets} Sets</span>
        <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">{exercise.reps} Reps</span>
        <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-red-500">{exercise.rest} Rest</span>
      </div>
      <p className="text-xs text-indigo-600 mt-1 italic">"{exercise.notes}"</p>
    </div>
  </div>
);

export const WorkoutEngine: React.FC<WorkoutEngineProps> = ({ 
  profile, 
  onOpenLive,
  hasAccess = true, 
  onUpgrade = async () => {} 
}) => {
  const [location, setLocation] = useState<WorkoutLocation>('Home');
  const [plan, setPlan] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PhysiqueAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async (feedback: string = "Standard") => {
    setLoading(true);
    try {
      const newPlan = await generateWorkoutPlan(profile, location, feedback);
      setPlan(newPlan);
    } catch (error) {
      alert("Failed to generate workout plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhysiqueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyzing(true);
      try {
        const result = await analyzePhysiqueDeep(e.target.files[0]);
        setAnalysisResult(result);
      } catch (error) {
        alert("Could not analyze physique.");
      } finally {
        setAnalyzing(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        {/* Header & Controls (Locked View) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-6 h-6 text-indigo-600" />
                Fitness Architect
              </h2>
              <p className="text-sm text-gray-500">
                Personalized {profile.weight || 70}kg Recomp Protocol
              </p>
            </div>
          </div>
        </div>
        <PremiumLock featureName="Gym Planner & Analysis" onUpgrade={onUpgrade} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-6 h-6 text-indigo-600" />
              Fitness Architect
            </h2>
            <p className="text-sm text-gray-500">
              Personalized {profile.weight || 70}kg Recomp Protocol
            </p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setLocation('Home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                location === 'Home' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              Home (No Eqpt)
            </button>
            <button
              onClick={() => setLocation('Gym')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                location === 'Gym' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Gym (Full)
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleGenerate("Standard")}
            disabled={loading}
            className="flex-1 min-w-[200px] bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center justify-center gap-2 font-medium disabled:opacity-70"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {plan.length > 0 ? `Regenerate ${location} Split` : `Generate ${location} Split`}
          </button>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing}
            className="flex-shrink-0 bg-gray-900 text-yellow-400 px-4 py-3 rounded-xl hover:bg-black transition shadow-md flex items-center justify-center gap-2 font-medium"
          >
             {analyzing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
             <span className="hidden sm:inline">Physique Check</span>
          </button>

          {onOpenLive && (
             <button
               onClick={onOpenLive}
               className="flex-shrink-0 bg-indigo-50 text-indigo-600 px-4 py-3 rounded-xl hover:bg-indigo-100 transition shadow-sm flex items-center justify-center gap-2 font-medium"
             >
                <Mic className="w-5 h-5" />
             </button>
          )}

          <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handlePhysiqueUpload} 
             className="hidden" 
             accept="image/*"
          />
        </div>
      </div>

      {/* Physique Analysis Result */}
      {analysisResult && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg animate-fade-in border border-gray-700">
           <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Camera className="w-5 h-5 text-yellow-400" />
                Physique Scan
              </h3>
              <button onClick={() => setAnalysisResult(null)} className="text-gray-400 hover:text-white"><Zap className="w-4 h-4 rotate-45" /></button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Visible Landmarks</p>
                <div className="flex flex-wrap gap-2">
                   {analysisResult.landmarks.map((tag, i) => (
                     <span key={i} className="bg-white/10 px-2 py-1 rounded text-xs border border-white/20">{tag}</span>
                   ))}
                </div>
              </div>
              
              <div>
                 <p className="text-gray-400 text-xs uppercase font-bold tracking-wider mb-2">Target Focus Areas</p>
                 <ul className="list-disc list-inside text-sm text-gray-200">
                    {analysisResult.focusAreas.map((area, i) => (
                      <li key={i}>{area}</li>
                    ))}
                 </ul>
              </div>
           </div>
           
           <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm italic text-yellow-100">"{analysisResult.feedback}"</p>
           </div>
        </div>
      )}

      {/* Workout Plan Display */}
      {plan.length > 0 && (
        <div className="animate-fade-in space-y-6">
           
           {/* Progressive Overload Check */}
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Info className="w-5 h-5 text-indigo-600" />
                 <span className="text-sm text-indigo-900 font-medium">How was your last session?</span>
              </div>
              <div className="flex gap-2">
                 <button 
                   onClick={() => handleGenerate("Too Easy")}
                   className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition text-indigo-700"
                 >
                   Too Easy (+Intensity)
                 </button>
                 <button 
                    onClick={() => handleGenerate("Too Hard")}
                    className="text-xs px-3 py-1.5 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-600 hover:text-white transition text-indigo-700"
                 >
                   Too Hard (-Volume)
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plan.map((session, sIdx) => (
                <div key={sIdx} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 flex flex-col h-full">
                  <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800">{session.day}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{session.focus}</p>
                  </div>
                  
                  <div className="p-4 space-y-3 flex-1">
                    {session.exercises.map((ex, eIdx) => (
                      <ExerciseCard key={eIdx} exercise={ex} index={eIdx} />
                    ))}
                  </div>

                  <div className="p-4 bg-yellow-50 border-t border-yellow-100">
                     <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-xs font-bold text-yellow-700 uppercase">NEAT Hack</p>
                           <p className="text-xs text-yellow-800">{session.neatHack}</p>
                        </div>
                     </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {!plan.length && !loading && !analysisResult && (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600">No Plan Generated</h3>
          <p className="text-sm text-gray-400 mb-4">Select your environment and hit generate to get your student split.</p>
        </div>
      )}
    </div>
  );
};