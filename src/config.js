// Provider configuration
export const AUTH_PROVIDER = 'firebase'; // 'firebase' | 'supabase'
export const STORAGE_PROVIDER = 'firebase'; // 'firebase' | 'supabase' | 'local'
export const RECOGNIZER_PROVIDER = 'dakanji'; // 'ichisadashioko' | 'dakanji'

// Firebase configuration
// Get these values from Firebase Console:
// Project Settings > General > Your apps > Web app
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Feature flags
export const FEATURES = {
  // Maximum history items for anonymous users
  ANONYMOUS_HISTORY_LIMIT: 100,
  // Maximum history items for authenticated users (0 = unlimited)
  AUTHENTICATED_HISTORY_LIMIT: 0
};
