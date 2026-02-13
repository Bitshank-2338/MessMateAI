import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Plus, X, AlertCircle, Trash2 } from 'lucide-react';
import { analyzeMeal } from '../services/gemini';
import { AnalysisResult, MealLog, UserProfile } from '../types';

interface MealAnalyzerProps {
  onLogMeal: (log: MealLog) => void;
  userProfile: UserProfile;
}

export const MealAnalyzer: React.FC<MealAnalyzerProps> = ({ onLogMeal, userProfile }) => {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Reset previous result
    }
  };

  const clearImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetForm = () => {
    clearImage();
    setDescription('');
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!image && !description) {
      setError("Please upload a photo or describe your meal.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const analysis = await analyzeMeal(image, description, userProfile);
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;

    const newLog: MealLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dateStr: new Date().toISOString().split('T')[0],
      description: description || "Meal Entry",
      totalStats: {
        calories: result.totalCalories,
        protein: result.totalProtein,
        carbs: result.totalCarbs,
      },
      items: result.items,
      feedback: result.feedback,
      imageUrl: previewUrl || undefined
    };

    onLogMeal(newLog);
    
    // Reset form
    resetForm();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Camera className="w-5 h-5 text-indigo-600" />
        Log a New Meal
      </h2>

      {/* Input Section - Fades out when loading */}
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Image Upload Area */}
        <div className="mb-4">
          {!previewUrl ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Tap to upload a meal photo</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden max-h-64 w-full bg-gray-100 flex items-center justify-center">
              <img src={previewUrl} alt="Meal preview" className="w-full h-full object-contain" />
              <button 
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Puran poli with amti, homemade..."
            className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
            rows={3}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {!result ? (
        <div className="flex gap-3">
          {(image || description) && (
            <button
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition flex items-center justify-center"
              title="Clear form"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={handleAnalyze}
            disabled={loading || (!image && !description)}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition shadow-md ${
              loading || (!image && !description)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Meal'
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">Analysis Result</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                <div className="text-xs text-gray-500 uppercase font-bold">Calories</div>
                <div className="text-lg font-bold text-indigo-600">{result.totalCalories}</div>
              </div>
              <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                <div className="text-xs text-gray-500 uppercase font-bold">Protein</div>
                <div className="text-lg font-bold text-emerald-600">{result.totalProtein}g</div>
              </div>
              <div className="bg-white p-2 rounded-lg text-center shadow-sm">
                <div className="text-xs text-gray-500 uppercase font-bold">Carbs</div>
                <div className="text-lg font-bold text-amber-600">{result.totalCarbs}g</div>
              </div>
            </div>
            
            <div className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Items Detected:</p>
              <ul className="text-sm text-gray-600 list-disc pl-4 space-y-1">
                {result.items.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{item.name}</span>: {item.calories}kcal, {item.protein}g P, {item.carbs}g C
                  </li>
                ))}
              </ul>
            </div>

            <div className="text-sm text-indigo-800 bg-indigo-100 p-3 rounded-lg">
              <strong>Feedback: </strong> {result.feedback}
            </div>
          </div>

          <div className="flex gap-3">
             <button
              onClick={() => setResult(null)}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition"
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-md transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Log to Daily Total
            </button>
          </div>
        </div>
      )}
    </div>
  );
};