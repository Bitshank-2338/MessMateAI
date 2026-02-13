import { createClient } from '@supabase/supabase-js';

// Safely access Vite's import.meta.env, falling back to an empty object if undefined
const env = (import.meta as any).env || {};

// Use environment variables if available, otherwise fallback to provided credentials
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://sxawmqorngtwyvavdbdt.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YXdtcW9ybmd0d3l2YXZkYmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzMwNjMsImV4cCI6MjA4NjU0OTA2M30.Kx3k5Er8_77RahwAhcYh4BzI1Dszob8tER2QRwI6jNM';

export const supabase = createClient(supabaseUrl, supabaseKey);