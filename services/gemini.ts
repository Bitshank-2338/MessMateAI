import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, CrisisSuggestion, UserProfile, DayPlan, AIMode, ChatMessage, WorkoutSession, WorkoutLocation, PhysiqueAnalysis } from "../types";

// Helper to get API key from environment
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzePhysique = async (imageFile: File): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const imageData = await fileToGenerativePart(imageFile);
    const prompt = "Analyze the physique in this image. Provide a short, concise description (2-5 words) of this body type and fitness goal (e.g., 'Lean Athletic Build', 'Muscular Bodybuilder', 'Slim Runner', 'Bulky Powerlifter'). Do not include any intro or outro text, just the description.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-02-05',
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
           { inlineData: { mimeType: imageFile.type, data: imageData } },
           { text: "Analyze my physique for a cutting program." }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 32768 },
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
  intensityAdjustment: string = "Standard"
): Promise<WorkoutSession[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `
      Role: Lead Fitness Architect for MessMate AI.
      User: Student, ${profile.weight || '70'}kg, Vegetarian.
      Goal: Body Recomposition (Cut Stomach/Side Fat).
      Location: ${location}.
      Feedback Context: ${intensityAdjustment}.
      Create a 3-Day "Student Split" in JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
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
      parts.push({ text: `User description of the meal: "${description}"` });
    }
    
    if (parts.length === 0) {
      throw new Error("Please provide an image or a description.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-02-05',
      contents: { parts },
      config: {
        systemInstruction: `Analyze nutrition for a student in ${profile.location}. Target: ${profile.fitnessGoal}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            totalCalories: { type: Type.NUMBER },
            totalProtein: { type: Type.NUMBER },
            totalCarbs: { type: Type.NUMBER },
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
            feedback: { type: Type.STRING }
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

export const getMessCrisisSuggestions = async (profile: UserProfile, specificQuery?: string): Promise<CrisisSuggestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const queryPart = specificQuery ? `Specific Issue: "${specificQuery}".` : "";
    const prompt = `Student in ${profile.location}. Mess closed. Diet: ${profile.dietType}. Budget: ${profile.budget}. Setup: ${profile.cookingSetup}. ${queryPart} Suggest 3 alternatives in JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-preview-02-05',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              estimatedCost: { type: Type.STRING },
              proteinContent: { type: Type.STRING },
              preparationMethod: { type: Type.STRING }
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Create a 7-day Meal Plan for a student in ${profile.location}. Diet: ${profile.dietType}. Goal: ${profile.fitnessGoal}. JSON format.`;

    const mealItemSchema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER },
        carbs: { type: Type.NUMBER },
        prepTime: { type: Type.STRING },
        instructions: { type: Type.STRING }
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING },
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
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    // Calculate Subscription Status
    const created = new Date(profile.createdAt || Date.now());
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = !profile.isPremium && diffDays > 15;

    const subscriptionInstruction = `
      ROLE: Messmate AI Subscription Manager & Nutrition Intelligence.
      
      SUBSCRIPTION RULES:
      1. Premium Price: ₹249 (One-time/Lifetime).
      2. Locked Features: "Weekly Planner" (7-day meal plans) and "Gym Planner" (Workout routines).
      3. User Status: ${isExpired ? 'EXPIRED TRIAL (Unpaid)' : 'ACTIVE (Paid or Trial)'}.
      4. User Premium: ${profile.isPremium ? 'YES' : 'NO'}.

      ACCESS CONTROL (Strict Enforcement):
      - IF Status is EXPIRED TRIAL: 
         - You MUST NOT generate full 7-day meal plans or comprehensive gym splits.
         - If asked for these, refuse politely and say: "I'd love to help you with that! Your 15-day free trial has expired. To unlock the Weekly Planner and Gym Planner again, please upgrade to Messmate Premium for ₹249. This helps us keep the AI running and your health goals on track!"
      - IF Status is ACTIVE: 
         - You can generate plans freely.

      PAYMENT FLOW SCRIPT:
      - If user asks how to pay/upgrade: "₹249 covers everything (no hidden charges). Once you click 'Pay Now', you will be taken to our secure payment page. You can pay via UPI (GPay, PhonePe), Cards, or Netbanking. Fill your details to get a GST-compliant receipt."
      - Post-payment advice: "After payment, refresh the app to instantly unlock features."
      
      TONE: Helpful, supportive, grounded. No medical advice.
    `;

    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = recentHistory.concat([{
      role: 'user',
      parts: [{ text: userMessage }]
    }]);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: chat,
      config: {
        systemInstruction: `${subscriptionInstruction} \nContext: Student in ${profile.location}. Mode: ${mode}. Goal: ${profile.fitnessGoal}.`,
      }
    });

    return response.text || "Sorry, the lab is closed right now.";
  } catch (error) {
    console.error("Health Lab Error:", error);
    return "Error in the lab. Check your connection!";
  }
};