import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://sxawmqorngtwyvavdbdt.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4YXdtcW9ybmd0d3l2YXZkYmR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzMwNjMsImV4cCI6MjA4NjU0OTA2M30.Kx3k5Er8_77RahwAhcYh4BzI1Dszob8tER2QRwI6jNM';

export const supabase = createClient(supabaseUrl, supabaseKey);