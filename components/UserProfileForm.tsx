import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Save, XCircle, Activity, Target, Flame, Wallet, Utensils, Droplets, Upload, Loader2, Camera } from 'lucide-react';
import { UserProfile } from '../types';
import { analyzePhysique } from '../services/gemini';

interface UserProfileFormProps {
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ currentProfile, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(currentProfile);
  const [saved, setSaved] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(currentProfile);
  }, [currentProfile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
    setSaved(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
        setSaved(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAnalyzing(true);
      try {
        const description = await analyzePhysique(file);
        setFormData(prev => ({ ...prev, fitnessGoal: description }));
      } catch (error) {
        console.error(error);
        alert("Failed to analyze image. Please try again.");
      } finally {
        setAnalyzing(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-16 h-16 text-gray-300" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition transform hover:scale-110"
            title="Update Avatar"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={avatarInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="mt-4 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-center">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none text-center font-semibold text-lg"
              placeholder="Your Name"
            />
        </div>
      </div>

      {/* Section 1: Physical Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          1. Physical Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="175"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="70"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="21"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender || 'Male'}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel || 'Sedentary'}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
            >
              <option value="Sedentary">Sedentary (Little or no exercise)</option>
              <option value="Lightly Active">Lightly Active (Exercise 1-3 days/week)</option>
              <option value="Moderately Active">Moderately Active (Exercise 3-5 days/week)</option>
              <option value="Very Active">Very Active (Hard exercise 6-7 days/week)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" /> Daily Water Goal (Liters)
            </label>
            <input
              type="number"
              step="0.1"
              name="dailyWaterGoal"
              value={formData.dailyWaterGoal}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="3.0"
            />
            <p className="text-xs text-gray-500 mt-1">Recommended: 3-4 Liters for active students.</p>
          </div>
        </div>
      </div>

      {/* Section 2: Goal & Target Physique */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          2. Goal & Target Physique
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dream Physique</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
                className="flex-1 rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Lean Muscle, Visible Abs, Bulking"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition flex items-center gap-2 text-sm font-medium whitespace-nowrap"
                title="Upload target physique photo"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'AI Analyze'}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Upload a photo of your goal physique to auto-fill this.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Timeline</label>
              <input
                type="text"
                name="targetTimeline"
                value={formData.targetTimeline}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. 3 months"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Problem Areas</label>
              <input
                type="text"
                name="problemAreas"
                value={formData.problemAreas}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Belly fat, weak arms"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Dietary & Environmental */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-orange-500" />
          3. Dietary & Environmental
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diet Type</label>
            <select
              name="dietType"
              value={formData.dietType}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-Vegetarian">Non-Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Jain">Jain</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mess Meals per Day</label>
            <input
              type="number"
              name="messMealsPerDay"
              value={formData.messMealsPerDay}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="e.g. 2"
            />
          </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g. Pune"
              />
           </div>
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Extra Food Budget</label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="e.g. ₹2000/month or Low"
              />
           </div>
           <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies / Avoidances</label>
            <textarea
              name="avoidances"
              value={formData.avoidances}
              onChange={handleChange}
              rows={2}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="Sugar, Bread, Curd, Paneer..."
            />
           </div>
        </div>
      </div>

      {/* Section 4: Logistics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Flame className="w-5 h-5 text-red-500" />
          4. Logistics
        </h3>
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Setup</label>
           <select
              name="cookingSetup"
              value={formData.cookingSetup || 'Kettle Only'}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-red-500 outline-none bg-white"
            >
              <option value="None">None (Completely reliant on mess/outside)</option>
              <option value="Kettle Only">Kettle Only (Boiling water, Maggi, Eggs)</option>
              <option value="Induction/Hotplate">Induction/Hotplate (Can cook basics)</option>
              <option value="Full Kitchen">Full Kitchen (Stove, Fridge, Utensils)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              The AI will only suggest recipes you can actually make with your setup.
            </p>
        </div>
      </div>

      <div className="pt-2 sticky bottom-4">
        <button
          type="submit"
          className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-bold shadow-lg text-lg"
        >
          <Save className="w-5 h-5" />
          {saved ? 'Profile Updated!' : 'Save Fitness Profile'}
        </button>
      </div>
    </form>
  );
};