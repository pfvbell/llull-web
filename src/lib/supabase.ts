// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a client that can be used in the browser
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseKey);

// Log when supabase client is initialized for debugging
console.log('Supabase client initialized from lib/supabase.ts');