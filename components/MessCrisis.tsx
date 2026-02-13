import React, { useState } from 'react';
import { AlertTriangle, ChefHat, MapPin, Loader2, DollarSign } from 'lucide-react';
import { UserProfile, CrisisSuggestion } from '../types';
import { getMessCrisisSuggestions } from '../services/gemini';

interface MessCrisisProps {
  profile: UserProfile;
}

export const MessCrisis: React.FC<MessCrisisProps> = ({ profile }) => {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CrisisSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    if (!active) {
      setActive(true);
      setLoading(true);
      setError(null);
      try {
        const result = await getMessCrisisSuggestions(profile);
        setSuggestions(result);
      } catch (e) {
        setError("Failed to find suggestions. Try again.");
        setActive(false);
      } finally {
        setLoading(false);
      }
    } else {
      setActive(false);
      setSuggestions([]);
    }
  };

  return (
    <div className={`rounded-2xl transition-all duration-300 border mb-8 overflow-hidden ${active ? 'bg-orange-50 border-orange-200 shadow-md' : 'bg-white border-red-100'}`}>
      <div 
        onClick={handleActivate}
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-orange-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${active ? 'bg-orange-500 text-white' : 'bg-red-100 text-red-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold ${active ? 'text-orange-800' : 'text-gray-800'}`}>Mess Crisis Mode</h3>
            <p className="text-sm text-gray-500">Mess closed? Food bad? Get instant alternatives.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-orange-500' : 'bg-gray-200'}`}>
             <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${active ? 'translate-x-6' : ''}`}></div>
           </div>
        </div>
      </div>

      {active && (
        <div className="px-6 pb-6 pt-2 animate-fade-in">
          <div className="text-sm text-orange-700 mb-4 bg-orange-100 p-3 rounded-lg border border-orange-200 flex items-start gap-2">
             <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
             Finding cheap, high-protein <strong>{profile.dietType.toLowerCase()}</strong> options near <strong>{profile.location || 'Pune'}</strong>...
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-orange-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p>Consulting the food oracle...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestions.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-800">{item.name}</h4>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      {item.proteinContent}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={item.description}>{item.description}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                    <DollarSign className="w-3 h-3" />
                    <span>{item.estimatedCost}</span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-start gap-2">
                      <ChefHat className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-500">{item.preparationMethod}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};