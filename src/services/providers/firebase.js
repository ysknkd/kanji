import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { FIREBASE_CONFIG, FEATURES } from '../../config.js';
import { localStorage as localProvider } from './local.js';

// Initialize Firebase
let app = null;
let auth = null;
let db = null;

function initFirebase() {
  if (app) return;

  if (!FIREBASE_CONFIG.apiKey) {
    console.warn('Firebase configuration not found. Authentication disabled.');
    return;
  }

  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
}

// Map Firebase user to our User type
function mapFirebaseUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL
  };
}

// Firebase Auth Provider
export const firebaseAuth = {
  async signIn() {
    initFirebase();
    if (!auth) throw new Error('Firebase not configured');

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = mapFirebaseUser(result.user);

    // Migrate local data to cloud on first sign in
    await migrateLocalToCloud(user.id);

    return user;
  },

  async signOut() {
    if (!auth) return;
    await firebaseSignOut(auth);
  },

  getCurrentUser() {
    if (!auth) return null;
    return mapFirebaseUser(auth.currentUser);
  },

  onAuthStateChanged(callback) {
    initFirebase();
    if (!auth) {
      callback(null);
      return () => {};
    }

    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(mapFirebaseUser(user));
    });
  },

  isConfigured() {
    return !!FIREBASE_CONFIG.apiKey;
  }
};

// Migrate local storage data to Firestore
async function migrateLocalToCloud(userId) {
  try {
    const localHistory = await localProvider.getLocalData();

    if (localHistory.length === 0) return;

    // Get existing cloud data to avoid overwriting
    const cloudHistory = await firebaseStorage.getHistory(userId);
    const cloudChars = new Set(cloudHistory.map(h => h.character));

    // Filter out items that already exist in cloud
    const toMigrate = localHistory.filter(h => !cloudChars.has(h.character));

    if (toMigrate.length === 0) {
      await localProvider.clearLocalData();
      return;
    }

    // Batch write to Firestore
    const batch = writeBatch(db);
    for (const item of toMigrate) {
      const ref = doc(db, 'users', userId, 'history', item.character);
      batch.set(ref, item, { merge: true });
    }
    await batch.commit();

    // Clear local storage after successful migration
    await localProvider.clearLocalData();

    console.log(`Migrated ${toMigrate.length} items to cloud storage`);
  } catch (error) {
    console.error('Failed to migrate local data to cloud:', error);
  }
}

// Firebase Storage Provider
export const firebaseStorage = {
  async getHistory(userId) {
    // Fall back to local storage if not authenticated
    if (!userId || !db) {
      return localProvider.getHistory();
    }

    try {
      const historyRef = collection(db, 'users', userId, 'history');
      const q = query(historyRef, orderBy('savedAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Failed to get history from Firestore:', error);
      return [];
    }
  },

  async addToHistory(userId, item) {
    // Fall back to local storage if not authenticated
    if (!userId || !db) {
      return localProvider.addToHistory(null, item);
    }

    try {
      const ref = doc(db, 'users', userId, 'history', item.character);
      await setDoc(ref, item);
      return this.getHistory(userId);
    } catch (error) {
      console.error('Failed to add to Firestore:', error);
      return this.getHistory(userId);
    }
  },

  async removeFromHistory(userId, character) {
    // Fall back to local storage if not authenticated
    if (!userId || !db) {
      return localProvider.removeFromHistory(null, character);
    }

    try {
      const ref = doc(db, 'users', userId, 'history', character);
      await deleteDoc(ref);
      return this.getHistory(userId);
    } catch (error) {
      console.error('Failed to remove from Firestore:', error);
      return this.getHistory(userId);
    }
  },

  async clearHistory(userId) {
    if (!userId || !db) {
      return localProvider.clearHistory();
    }

    try {
      const historyRef = collection(db, 'users', userId, 'history');
      const snapshot = await getDocs(historyRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      return [];
    } catch (error) {
      console.error('Failed to clear Firestore history:', error);
      return this.getHistory(userId);
    }
  }
};
