
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your .env file.')
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
)

// Debug log to help identify config issues in production
console.log('Supabase Client Initialized:', {
    url: supabaseUrl ? (supabaseUrl.substring(0, 15) + '...') : 'MISSING',
    keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    isDev: import.meta.env.DEV
});

export const isSupabaseConfigured = () => {
    return supabaseUrl && supabaseAnonKey &&
        supabaseUrl !== 'https://your-project.supabase.co' &&
        supabaseUrl !== 'https://placeholder.supabase.co' &&
        supabaseAnonKey !== 'your-anon-key' &&
        supabaseAnonKey !== 'placeholder';
}
