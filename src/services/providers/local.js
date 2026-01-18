import { FEATURES } from '../../config.js';

const STORAGE_KEY = 'kanji-history';

// Local Auth Provider (stub - no real auth)
export const localAuth = {
  async signIn() {
    throw new Error('Local authentication not supported');
  },

  async signOut() {
    // no-op
  },

  getCurrentUser() {
    return null;
  },

  onAuthStateChanged(callback) {
    // Always anonymous
    callback(null);
    return () => {};
  }
};

// Local Storage Provider
export const localStorage = {
  async getHistory() {
    try {
      const data = window.localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async addToHistory(userId, item) {
    try {
      const history = await this.getHistory();

      // Remove if already exists
      const filtered = history.filter(h => h.character !== item.character);

      // Add to beginning
      const updated = [item, ...filtered];

      // Apply limit for anonymous users
      const limit = FEATURES.ANONYMOUS_HISTORY_LIMIT;
      const limited = limit > 0 ? updated.slice(0, limit) : updated;

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
      return limited;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return this.getHistory();
    }
  },

  async removeFromHistory(userId, character) {
    try {
      const history = await this.getHistory();
      const updated = history.filter(h => h.character !== character);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
      return this.getHistory();
    }
  },

  async clearHistory() {
    window.localStorage.removeItem(STORAGE_KEY);
    return [];
  },

  // Get raw data for migration
  async getLocalData() {
    return this.getHistory();
  },

  // Clear local data after migration
  async clearLocalData() {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};
