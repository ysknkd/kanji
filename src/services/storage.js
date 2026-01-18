import { STORAGE_PROVIDER } from '../config.js';
import { firebaseStorage } from './providers/firebase.js';
import { localStorage } from './providers/local.js';

// Select storage provider based on configuration
function getProvider() {
  switch (STORAGE_PROVIDER) {
    case 'firebase':
      return firebaseStorage;
    case 'supabase':
      // TODO: implement supabase provider
      throw new Error('Supabase storage not implemented yet');
    case 'local':
    default:
      return localStorage;
  }
}

const provider = getProvider();

// Storage service - exposes a consistent interface regardless of provider
export const storage = {
  /**
   * Get user's kanji history
   * @param {string|null} userId - User ID (null for anonymous)
   * @returns {Promise<HistoryItem[]>}
   */
  getHistory(userId) {
    return provider.getHistory(userId);
  },

  /**
   * Add a kanji to history
   * @param {string|null} userId - User ID (null for anonymous)
   * @param {HistoryItem} item - The history item to add
   * @returns {Promise<HistoryItem[]>} Updated history
   */
  addToHistory(userId, item) {
    return provider.addToHistory(userId, item);
  },

  /**
   * Remove a kanji from history
   * @param {string|null} userId - User ID (null for anonymous)
   * @param {string} character - The kanji character to remove
   * @returns {Promise<HistoryItem[]>} Updated history
   */
  removeFromHistory(userId, character) {
    return provider.removeFromHistory(userId, character);
  },

  /**
   * Clear all history
   * @param {string|null} userId - User ID (null for anonymous)
   * @returns {Promise<HistoryItem[]>} Empty array
   */
  clearHistory(userId) {
    return provider.clearHistory(userId);
  }
};
