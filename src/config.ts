/**
 * Public connection settings. These are safe to ship inside the app: the publishable key
 * only allows what the database's row level security rules allow.
 * Never put the secret / service_role key here.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://ntzphpuwdxabtushztlp.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_a6HwXJTqt3PwXQWNHqJ5mQ_T-PxahK8';

/** Set EXPO_PUBLIC_DEMO=1 to run with built-in sample data instead of the real database. */
export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO === '1';
