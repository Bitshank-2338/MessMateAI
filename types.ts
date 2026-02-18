
export interface NutritionStats {
  calories: number;
  protein: number;
  carbs: number;
}

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
}

export interface MealLog {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  description: string;
  imageUrl?: string;
  totalStats: NutritionStats;
  items: FoodItem[];
  feedback: string;
}

export interface AnalysisResult {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  items: FoodItem[];
  feedback: string;
}

export interface UserProfile {
  // Basic
  name: string;
  location: string;
  avatarUrl?: string;
  
  // Subscription
  createdAt?: string; // ISO Date string of account creation
  isPremium?: boolean; // Payment status

  // Physical Metrics
  age: number | '';
  height: number | ''; // cm
  weight: number | ''; // kg
  gender: 'Male' | 'Female' | 'Other';
  activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Super Active';
  dailyWaterGoal: number; // Liters

  // Goals
  fitnessGoal: string; // e.g. Lean Muscle, Fat Loss
  targetTimeline: string; // e.g. 3 months
  problemAreas: string;

  // Diet & Environment
  dietType: string;
  avoidances: string; // Comma separated string
  messMealsPerDay: number | '';
  budget: string; // text description or amount

  // Logistics
  cookingSetup: 'None' | 'Kettle Only' | 'Induction/Hotplate' | 'Full Kitchen';
}

export interface CrisisSuggestion {
  name: string;
  description: string;
  estimatedCost: string;
  proteinContent: string;
  preparationMethod: string;
}

export interface MealPlanItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  prepTime: string;
  instructions: string; // Short prep instructions tailored to cooking setup
}

export interface DayPlan {
  day: string; // Monday, Tuesday etc.
  meals: {
    breakfast: MealPlanItem;
    lunch: MealPlanItem;
    snack: MealPlanItem;
    dinner: MealPlanItem;
  };
}

export type AIMode = 'recipe' | 'gym' | 'crisis' | 'general';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type WorkoutLocation = 'Gym' | 'Home';

export interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string; // "Focus on squeezing glutes"
}

export interface WorkoutSession {
  day: string; // "Push", "Pull", "Legs"
  focus: string; // "Chest & Triceps"
  exercises: Exercise[];
  neatHack: string; // "Take stairs to 4th floor"
}

export interface PhysiqueAnalysis {
  landmarks: string[];
  bodyType: string;
  focusAreas: string[];
  feedback: string;
}