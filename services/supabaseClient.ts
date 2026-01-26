
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your .env file.')
}

// Handle proxy path: convert relative URL to absolute URL for local development
const getAbsoluteUrl = (url: string): string => {
    if (!url) return 'https://placeholder.supabase.co';

    // If it's a relative path (like /supa-api), convert to absolute URL
    if (url.startsWith('/')) {
        // In browser environment, we can construct absolute URL
        if (typeof window !== 'undefined') {
            return `${window.location.origin}${url}`;
        }
        // Fallback for SSR or other environments
        return `http://localhost:3000${url}`;
    }

    return url;
};

export const supabase = createClient(
    getAbsoluteUrl(supabaseUrl),
    supabaseAnonKey || 'placeholder'
)

// Debug log to help identify config issues in production
console.log('Supabase Client Initialized:', {
    originalUrl: supabaseUrl,
    absoluteUrl: getAbsoluteUrl(supabaseUrl),
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
