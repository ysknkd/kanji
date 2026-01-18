import { AUTH_PROVIDER } from '../config.js';
import { firebaseAuth } from './providers/firebase.js';
import { localAuth } from './providers/local.js';

// Select auth provider based on configuration
function getProvider() {
  switch (AUTH_PROVIDER) {
    case 'firebase':
      return firebaseAuth;
    case 'supabase':
      // TODO: implement supabase provider
      throw new Error('Supabase auth not implemented yet');
    default:
      return localAuth;
  }
}

const provider = getProvider();

// Auth service - exposes a consistent interface regardless of provider
export const auth = {
  /**
   * Sign in with the configured provider (Google OAuth)
   * @returns {Promise<User>} The authenticated user
   */
  signIn() {
    return provider.signIn();
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  signOut() {
    return provider.signOut();
  },

  /**
   * Get the currently authenticated user
   * @returns {User|null}
   */
  getCurrentUser() {
    return provider.getCurrentUser();
  },

  /**
   * Subscribe to authentication state changes
   * @param {function(User|null): void} callback
   * @returns {function} Unsubscribe function
   */
  onAuthStateChanged(callback) {
    return provider.onAuthStateChanged(callback);
  },

  /**
   * Check if authentication is configured and available
   * @returns {boolean}
   */
  isConfigured() {
    if (provider.isConfigured) {
      return provider.isConfigured();
    }
    return AUTH_PROVIDER !== 'local';
  }
};
