import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Trash2, Utensils, Droplets, Plus, Minus, Edit2, Check, X } from 'lucide-react';
import { MealLog, UserProfile } from '../types';
import { downloadCSV } from '../utils/csv';

interface DailyTrackerProps {
  logs: MealLog[];
  waterLogs: Record<string, number>;
  onUpdateWater: (amount: number) => void;
  userProfile: UserProfile;
  onClearLogs: () => void;
  onDeleteLog: (id: string) => void;
  onUpdateWaterGoal: (goal: number) => void;
}

interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  water: number;
}

export const DailyTracker: React.FC<DailyTrackerProps> = ({ 
  logs, 
  waterLogs, 
  onUpdateWater, 
  userProfile, 
  onClearLogs, 
  onDeleteLog,
  onUpdateWaterGoal
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const currentWater = waterLogs[today] || 0;
  const waterGoal = userProfile.dailyWaterGoal || 3;
  // Cap percentage at 100 for the bar, but display real value
  const waterPercentage = Math.min(100, (currentWater / waterGoal) * 100);

  // Helper to get last 7 days dates
  const getLast7Days = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };

  const handleEditClick = () => {
    setTempGoal(waterGoal.toString());
    setIsEditingGoal(true);
  };

  const handleSaveGoal = () => {
    const val = parseFloat(tempGoal);
    if (!isNaN(val) && val > 0) {
      onUpdateWaterGoal(val);
      setIsEditingGoal(false);
    }
  };

  // Aggregate data for chart
  const last7Days = getLast7Days();
  const chartData: DailyStats[] = last7Days.map(date => {
    const daysLogs = logs.filter(l => l.dateStr === date);
    const water = waterLogs[date] || 0;
    
    return {
      date: date.substring(5), // MM-DD for display
      calories: daysLogs.reduce((sum, log) => sum + log.totalStats.calories, 0),
      protein: daysLogs.reduce((sum, log) => sum + log.totalStats.protein, 0),
      carbs: daysLogs.reduce((sum, log) => sum + log.totalStats.carbs, 0),
      water: Number(water.toFixed(1))
    };
  });

  const totalCaloriesToday = chartData[chartData.length - 1].calories;
  const totalProteinToday = chartData[chartData.length - 1].protein;
  const totalCarbsToday = chartData[chartData.length - 1].carbs;

  return (
    <div className="space-y-6">
      
      {/* Water Tracking Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Background decorative blob */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
        
        <div className="flex items-center gap-4 z-10">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Droplets className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Hydration Station</h3>
            {isEditingGoal ? (
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-gray-500">Target:</span>
                  <input 
                    type="number" 
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    step="0.5"
                    className="w-16 px-1 py-0.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGoal()}
                  />
                  <button onClick={handleSaveGoal} className="p-1 text-green-600 hover:bg-green-50 rounded transition"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setIsEditingGoal(false)} className="p-1 text-red-500 hover:bg-red-50 rounded transition"><X className="w-3.5 h-3.5" /></button>
               </div>
            ) : (
               <p 
                 className="text-gray-500 text-sm flex items-center gap-2 group cursor-pointer hover:text-blue-600 transition-colors"
                 onClick={handleEditClick}
                 title="Click to edit target"
               >
                 Target: <span className="font-medium text-blue-600">{waterGoal}L</span>
                 <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
               </p>
            )}
          </div>
        </div>

        <div className="flex-1 w-full md:w-auto px-4 z-10">
           <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
             <span className="text-blue-600">{currentWater.toFixed(1)} L</span>
             <span className="text-gray-400">{Math.round((currentWater / waterGoal) * 100)}%</span>
           </div>
           
           {/* Enhanced Progress Bar */}
           <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden shadow-inner border border-gray-200 relative">
             {/* Liquid Gradient Bar */}
             <div 
               className="h-full rounded-full transition-all duration-700 ease-out relative" 
               style={{ 
                 width: `${waterPercentage}%`,
                 background: 'linear-gradient(90deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
               }}
             >
                {/* Shine effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-20 rounded-t-full"></div>
                {/* Wave-like pattern overlay (simulated) */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}
                ></div>
             </div>
           </div>
        </div>

        <div className="flex gap-2 shrink-0 z-10">
          <button 
            onClick={() => onUpdateWater(-0.25)}
            className="p-3 rounded-xl bg-gray-50 text-gray-600 shadow-sm border border-gray-200 hover:bg-gray-100 transition active:scale-95"
            title="Remove 250ml"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onUpdateWater(0.25)}
            className="flex items-center gap-2 py-3 px-4 rounded-xl bg-blue-500 text-white shadow-md hover:bg-blue-600 hover:shadow-lg transition active:scale-95 font-medium"
            title="Add 250ml"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">250ml</span>
          </button>
          <button 
            onClick={() => onUpdateWater(0.5)}
            className="flex items-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition active:scale-95 font-medium"
            title="Add 500ml"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">500ml</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">Today's Calories</h3>
          <p className="text-2xl font-bold text-gray-800">{totalCaloriesToday} <span className="text-sm font-normal text-gray-400">kcal</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">Today's Protein</h3>
          <p className="text-2xl font-bold text-emerald-600">{totalProteinToday.toFixed(1)} <span className="text-sm font-normal text-gray-400">g</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">Today's Carbs</h3>
          <p className="text-2xl font-bold text-amber-600">{totalCarbsToday.toFixed(1)} <span className="text-sm font-normal text-gray-400">g</span></p>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutrient & Hydration Trends (Last 7 Days)</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{fontSize: 12}} />
              <YAxis yAxisId="left" tick={{fontSize: 12}} label={{ value: 'Grams (g)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }} />
              <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12}} label={{ value: 'Water (L)', angle: 90, position: 'insideRight', style: { fill: '#60a5fa' } }} />
              <Tooltip 
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="protein" name="Protein (g)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar yAxisId="left" dataKey="carbs" name="Carbs (g)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="water" name="Water (L)" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Log History List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Meal History</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => downloadCSV(logs)}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No meals logged yet. Snap a photo to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.slice().reverse().map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-gray-50 hover:border-gray-200 hover:bg-gray-50 transition">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-400">{log.dateStr} • {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <button onClick={() => onDeleteLog(log.id)} className="text-gray-300 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="font-medium text-gray-800 mb-2">{log.description}</h4>
                  <div className="flex gap-3 text-sm">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold">{log.totalStats.calories} kcal</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold">{log.totalStats.protein}g Prot</span>
                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{log.totalStats.carbs}g Carbs</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">"{log.feedback}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};