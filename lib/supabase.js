// lib/supabase.js - Supabase Client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Don't throw error on client side, just log warning
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('Missing Supabase environment variables. Please check your .env.local file.');
}

// Create client with fallback values to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Use PKCE flow for better security and CORS compatibility
      // Handle 522 errors (Supabase timeout) gracefully
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
    },
    global: {
      headers: {
        'x-client-info': 'synax-web-app',
      },
      // Add fetch timeout to prevent hanging requests
      fetch: (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        return fetch(url, {
          ...options,
          signal: controller.signal,
        })
        .finally(() => clearTimeout(timeoutId))
        .catch((error) => {
          // Handle 522 errors (Cloudflare timeout)
          if (error.name === 'AbortError' || error.message?.includes('522')) {
            console.error('⚠️ Supabase timeout (522) - Server may be overloaded. Please try again in a few minutes.');
            throw new Error('Supabase server timeout. Please try again in a few minutes.');
          }
          throw error;
        });
      },
    },
  }
);

// Server-side client (service role key ile)
export const createServerClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
