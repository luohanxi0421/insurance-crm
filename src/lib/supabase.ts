import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const rawSupabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabaseUrl = rawSupabaseUrl.trim();
const supabaseAnonKey = rawSupabaseAnonKey.trim();

const isLikelyValidUrl = (() => {
  if (!supabaseUrl) return false;
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
})();

const isSupabaseConfigured = Boolean(isLikelyValidUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[config] Supabase env invalid/missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in EAS env.'
  );
}

// Avoid crashing at import time when release build is missing env values.
// Real requests will fail with clear network/auth errors until env is set.
const fallbackUrl = 'https://example.invalid';
const fallbackAnonKey = 'missing-anon-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export { isSupabaseConfigured };
