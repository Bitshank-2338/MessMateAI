import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, CrisisSuggestion, UserProfile, DayPlan, AIMode, ChatMessage, WorkoutSession, WorkoutLocation, PhysiqueAnalysis } from "../types";

// Initialize Gemini client
// Using import.meta.env for Vite support, falling back to process.env if needed (though process.env is mocked to {} in vite.config)
const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePhysique = async (imageFile: File): Promise<string> => {
  try {
    const imageData = await fileToGenerativePart(imageFile);
    // Prompt specifically asks for a short description suitable for a form field
    const prompt = "Analyze the physique in this image. Provide a short, concise description (2-5 words) of this body type and fitness goal (e.g., 'Lean Athletic Build', 'Muscular Bodybuilder', 'Slim Runner', 'Bulky Powerlifter'). Do not include any intro or outro text, just the description.";

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: imageFile.type, data: imageData } },
          { text: prompt }
        ]
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return text.trim();

  } catch (error) {
    console.error("Physique Analysis Error:", error);
    throw error;
  }
};

export const analyzePhysiqueDeep = async (imageFile: File): Promise<PhysiqueAnalysis> => {
  try {
    const imageData = await fileToGenerativePart(imageFile);
    const systemInstruction = `
      You are the Lead Fitness Architect.
      Task: Perform a visual scan of the user's physique for bodybuilding/fitness purposes.
      1. Tag Visible Landmarks: (e.g., "Shoulder width relative to waist", "Visible abs", "Pectoral definition").
      2. Identify Problem Areas: Look specifically for "Side Fat" (Love handles) or "Lower Belly" if visible.
      3. Body Type: Ectomorph/Mesomorph/Endomorph blend.
      4. Feedback: Actionable advice based on the visual.
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
           { inlineData: { mimeType: imageFile.type, data: imageData } },
           { text: "Analyze my physique for a cutting program." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            landmarks: { type: Type.ARRAY, items: { type: Type.STRING } },
            bodyType: { type: Type.STRING },
            focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
            feedback: { type: Type.STRING }
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as PhysiqueAnalysis;
  } catch (error) {
    console.error("Deep Analysis Error:", error);
    throw error;
  }
};

export const generateWorkoutPlan = async (
  profile: UserProfile, 
  location: WorkoutLocation,
  intensityAdjustment: string = "Standard" // "Too Easy", "Too Hard", "Standard"
): Promise<WorkoutSession[]> => {
  try {
    const prompt = `
      Role: Lead Fitness Architect for MessMate AI.
      User: Student, ${profile.weight || '70'}kg, Vegetarian.
      Goal: Body Recomposition (Cut Stomach/Side Fat).
      Location: ${location} (Strictly enforce this).
      Feedback Context: ${intensityAdjustment}.
      
      Task: Create a 3-Day "Student Split" (e.g., Push/Pull/Legs or Full Body).
      
      Rules:
      1. Rest: Max 60s (Cardio effect).
      2. Reps: 8-12 (Hypertrophy) to maintain muscle.
      3. CORE MANDATE: Every session MUST include one Oblique/Side-fat exercise.
         - Gym: Cable Woodchoppers, Hanging Leg Raises.
         - Home: Russian Twists (with water bottle), Bicycle Crunches, Plank Hip Dips.
      4. GAS/BLOATING FILTER: If user profile mentions bloating (${profile.problemAreas}), avoid heavy crunches. Use standing core or stabilization.
      5. NEAT Hack: Suggest one non-exercise activity (e.g., "Take stairs to 4th floor", "Walk while calling parents").
      
      Mapping Logic:
      - Legs: ${location === 'Gym' ? 'Squats/Leg Press' : 'Bulgarian Split Squats (Chair)/Lunges'}.
      - Push: ${location === 'Gym' ? 'Bench Press/Dumbbell Press' : 'Incline Pushups (Bed edge)/Diamond Pushups'}.
      - Pull: ${location === 'Gym' ? 'Lat Pulldowns/Rows' : 'Doorframe Rows/Towel Pulls'}.

      Output JSON array of 3 sessions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
              focus: { type: Type.STRING },
              exercises: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    sets: { type: Type.NUMBER },
                    reps: { type: Type.STRING },
                    rest: { type: Type.STRING },
                    notes: { type: Type.STRING }
                  }
                }
              },
              neatHack: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    return JSON.parse(text) as WorkoutSession[];

  } catch (error) {
    console.error("Workout Gen Error:", error);
    throw error;
  }
};

export const analyzeMeal = async (
  imageFile: File | null,
  description: string,
  profile: UserProfile
): Promise<AnalysisResult> => {
  try {
    const parts: any[] = [];

    if (imageFile) {
      const imageData = await fileToGenerativePart(imageFile);
      parts.push({
        inlineData: {
          mimeType: imageFile.type,
          data: imageData
        }
      });
    }

    if (description) {
      parts.push({ text: `User description of the meal/day: "${description}"` });
    }
    
    // Fallback if no input
    if (parts.length === 0) {
      throw new Error("Please provide an image or a description.");
    }

    const systemInstruction = `
      You are a nutritional assistant specifically for a student living in ${profile.location || 'Maharashtra, India'}.
      
      User Fitness Profile:
      - Stats: ${profile.age ? `${profile.age} years old,` : ''} ${profile.height ? `${profile.height}cm,` : ''} ${profile.weight ? `${profile.weight}kg` : ''}
      - Gender: ${profile.gender}
      - Activity Level: ${profile.activityLevel}
      - Goal: ${profile.fitnessGoal} (Timeline: ${profile.targetTimeline})
      - Problem Areas: ${profile.problemAreas}
      - Diet Type: ${profile.dietType}
      - Foods to Avoid: ${profile.avoidances || 'None'}
      - Cooking Setup: ${profile.cookingSetup} (Only suggest advice compatible with this)
      - Mess Reliance: ${profile.messMealsPerDay} meals/day

      Your task:
      1. Analyze the provided meal image and/or text description.
      2. If height/weight/age are provided, mentally calculate the user's BMR and TDEE to frame your feedback (e.g., "This meal covers 30% of your daily needs for fat loss").
      3. Respect the user's diet type strictly.
      4. Do NOT recommend or suggest foods listed in 'Foods to Avoid' in your feedback.
      5. If suggesting alternatives, ensure they fit the user's budget (${profile.budget}) and cooking setup (${profile.cookingSetup}).
      
      Output must be a valid JSON object matching the requested schema.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: { type: Type.NUMBER, description: "Total estimated calories in kcal" },
            totalProtein: { type: Type.NUMBER, description: "Total estimated protein in grams" },
            totalCarbs: { type: Type.NUMBER, description: "Total estimated carbohydrates in grams" },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                }
              }
            },
            feedback: { type: Type.STRING, description: `Nutritional feedback tailored to a ${profile.dietType} student in ${profile.location} with goal ${profile.fitnessGoal}. Mention TDEE context if possible.` }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const getMessCrisisSuggestions = async (profile: UserProfile): Promise<CrisisSuggestion[]> => {
  try {
    const prompt = `
      I am a student currently in ${profile.location || 'Pune, Maharashtra'}. 
      My hostel mess is closed or serving bad food.
      I am a ${profile.dietType}.
      I need to avoid: ${profile.avoidances || 'None'}.
      My cooking setup is: ${profile.cookingSetup}.
      My budget is: ${profile.budget}.
      
      Suggest 3 high-protein, low-cost ${profile.dietType} alternatives I can find nearby (street food/shops) or cook easily in my room with my specific equipment (${profile.cookingSetup}).
      
      Return a JSON array of 3 suggestions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING, description: "Why this is a good option" },
              estimatedCost: { type: Type.STRING, description: "Approximate cost in INR" },
              proteinContent: { type: Type.STRING, description: "Approximate protein content" },
              preparationMethod: { type: Type.STRING, description: "How to get it or prepare it simply" }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as CrisisSuggestion[];

  } catch (error) {
    console.error("Mess Crisis Error:", error);
    throw error;
  }
}

export const generateWeeklyMealPlan = async (profile: UserProfile): Promise<DayPlan[]> => {
  try {
    const prompt = `
      Create a 7-day Meal Plan for a student in ${profile.location}.
      Goal: ${profile.fitnessGoal} (${profile.targetTimeline}).
      Diet: ${profile.dietType}.
      Avoid: ${profile.avoidances}.
      Cooking Setup: ${profile.cookingSetup} (CRITICAL: Only suggest recipes compatible with this setup).
      Budget: ${profile.budget}.
      
      Requirements:
      1. Provide specific Indian meal names common in Maharashtra.
      2. If Cooking Setup is "Kettle Only", suggest foods like Oats, Boiled Eggs (if non-veg), Maggi variants (healthy), Milk, Fruits, Raw salads. Do NOT suggest Chapatis/Bhakri unless specified as "Buy from outside".
      3. If Cooking Setup is "None", suggest specific mess food or affordable outside options (Thali, Idli, etc).
      4. Include simple "instructions" on how to prep it with their specific equipment.
      
      Return a JSON array of 7 objects (Monday to Sunday).
    `;

    const mealItemSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        prepTime: { type: Type.STRING },
        instructions: { type: Type.STRING, description: "Short prep instruction based on cooking setup" }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, description: "e.g., Monday" },
              meals: {
                type: Type.OBJECT,
                properties: {
                  breakfast: mealItemSchema,
                  lunch: mealItemSchema,
                  snack: mealItemSchema,
                  dinner: mealItemSchema
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as DayPlan[];

  } catch (error) {
    console.error("Meal Plan Error:", error);
    throw error;
  }
};

export const runHealthLabChat = async (
  history: ChatMessage[],
  userMessage: string,
  mode: AIMode,
  profile: UserProfile
): Promise<string> => {
  try {
    const systemInstruction = `
      You are the 'AI Health Lab' feature of MessMate AI, designed for a student in ${profile.location}.
      
      USER CONTEXT:
      - Weight: ${profile.weight || '70'}kg (Crucial for advice).
      - Goal: ${profile.fitnessGoal} (Focus on cutting stomach/side fat).
      - Diet: ${profile.dietType} (Strictly respect this).
      - Avoid: ${profile.avoidances} (Specifically: No bread, curd, paneer if asked).
      - Setup: ${profile.cookingSetup}.
      - Problem Areas: ${profile.problemAreas}.
      
      YOUR PERSONA MODES:
      
      1. RECIPE SPECIALIST (Active if user asks about food/cooking):
         - Focus on 'Hostel Hacks' (Kettle/Induction).
         - High protein VEG sources: Moong dal, Soya chunks, Matki (sprouts), Chana, Peanuts.
         - Local Context: Jowar/Bajra, Metkut, Karale chutney.
         - NO Bread, Curd, Paneer.
      
      2. GYM & PHYSICS ADVISOR (Active if user asks about workout/body):
         - Role: Lead Fitness Architect.
         - Focus on fat loss (stomach/side fat) for a ${profile.weight || 70}kg student.
         - Suggest 'Student-Budget' supplements (Sattu, etc) over expensive Whey.
         - Prioritize "Volume Eating" (filling low-cal foods like cucumber/greens) for cuts.
         - If user mentions GAS/BLOATING: Suggest ginger/hing and avoid heavy core crunching.
         - Training Style: Hypertrophy (8-12 reps), 60s rest.
      
      3. MESS EMERGENCY HANDLER (Active if user complains about mess/food availability):
         - Suggest local 'Khanawals' or street food hacks.
         - e.g., "Order Pithla but avoid oil", "Moong Bhaji but pat dry".
      
      TONE:
      - Encouraging, Witty, "Vibe-heavy".
      - Use local slang occasionally (Jugad, Bhaubeej, Ek number).
      - Keep answers short, punchy, and actionable.
      
      CURRENT MODE FOCUS: ${mode.toUpperCase()}
      (However, adapt to the user's actual question even if it drifts).

      Output Formatting Rule:
      - Do not use Markdown formatting.
      - DO NOT use asterisks ** for bolding. Use ALL CAPS for emphasis instead.
      - DO NOT use * or - for bullet points. Use simple dashes > or numbering 1. instead.
      - Ensure the output is plain text only, optimized for a simple chat interface.
      - Avoid any special symbols or characters that aren't standard punctuation.
    `;

    // Convert chat history to Gemini format
    // We take the last 10 messages to keep context but not overload tokens
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add current message
    const chat = recentHistory.concat([{
      role: 'user',
      parts: [{ text: userMessage }]
    }]);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: chat,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Sorry, the lab is closed right now (Network Error).";
  } catch (error) {
    console.error("Health Lab Error:", error);
    return "Something went wrong in the lab. Check your connection!";
  }
};