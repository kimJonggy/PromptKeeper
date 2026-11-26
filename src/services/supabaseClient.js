import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Checks whether Supabase is configured with valid credentials in the environment.
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    typeof supabaseUrl === 'string' && 
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project')
  );
}

/**
 * Singleton Supabase client instance.
 * Initialized only when valid environment credentials are provided.
 */
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

/**
 * Retrieves the current authenticated user session if configured.
 * @returns {Promise<Object|null>}
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (err) {
    console.warn('Failed to retrieve current Supabase user:', err);
    return null;
  }
}

/**
 * Signs in with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object|null, error: Error|null }>}
 */
export async function signInWithEmail(email, password) {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured.') };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user || null, error };
}

/**
 * Registers a new user account with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: Object|null, error: Error|null }>}
 */
export async function signUpWithEmail(email, password) {
  if (!supabase) {
    return { user: null, error: new Error('Supabase is not configured.') };
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data?.user || null, error };
}

/**
 * Signs out the current authenticated user.
 * @returns {Promise<{ error: Error|null }>}
 */
export async function signOut() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Subscribes to Supabase authentication state transitions.
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function onAuthStateChange(callback) {
  if (!supabase) {
    callback(null, null);
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user || null);
  });
  return () => {
    subscription.unsubscribe();
  };
}

