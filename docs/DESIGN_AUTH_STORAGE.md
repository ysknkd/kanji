# Authentication and Storage Design

## Overview

This document describes the architecture for authentication and cloud storage in the Kanji recognition app. The design prioritizes provider abstraction to enable easy migration between services (e.g., Firebase → Supabase).

## Goals

1. **Optional Authentication**: Users can use the app without logging in
2. **Provider Agnostic**: Easy to switch between Firebase, Supabase, or other providers
3. **Graceful Degradation**: Falls back to localStorage when offline or not authenticated
4. **Cross-device Sync**: Authenticated users get cloud storage with sync capabilities

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Application                          │
│                         (main.js)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
        ▼                                   ▼
┌───────────────────┐             ┌───────────────────┐
│   Auth Service    │             │  Storage Service  │
│    (auth.js)      │             │   (storage.js)    │
└────────┬──────────┘             └────────┬──────────┘
         │                                  │
         │ implements                       │ implements
         ▼                                  ▼
┌───────────────────┐             ┌───────────────────┐
│  AuthProvider     │             │  StorageProvider  │
│   (interface)     │             │    (interface)    │
└────────┬──────────┘             └────────┬──────────┘
         │                                  │
    ┌────┴────┐                    ┌────────┼────────┐
    │         │                    │        │        │
    ▼         ▼                    ▼        ▼        ▼
┌───────┐ ┌────────┐          ┌───────┐ ┌───────┐ ┌───────┐
│Firebase│ │Supabase│          │Firebase│ │Supabase│ │ Local │
│  Auth  │ │  Auth  │          │  Store │ │  Store │ │Storage│
└───────┘ └────────┘          └───────┘ └────────┘ └───────┘
```

## Interface Definitions

### AuthProvider Interface

```javascript
/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} email - User's email address
 * @property {string} displayName - User's display name
 * @property {string|null} photoURL - User's profile photo URL
 */

/**
 * @typedef {Object} AuthProvider
 * @property {function(): Promise<User>} signIn - Sign in with provider (Google)
 * @property {function(): Promise<void>} signOut - Sign out current user
 * @property {function(): User|null} getCurrentUser - Get current authenticated user
 * @property {function(callback: function(User|null)): function} onAuthStateChanged - Subscribe to auth state changes, returns unsubscribe function
 */
```

### StorageProvider Interface

```javascript
/**
 * @typedef {Object} HistoryItem
 * @property {string} character - The kanji character
 * @property {string} readings - Reading text (on/kun)
 * @property {number} savedAt - Timestamp when saved
 */

/**
 * @typedef {Object} StorageProvider
 * @property {function(userId: string|null): Promise<HistoryItem[]>} getHistory - Get user's history
 * @property {function(userId: string|null, item: HistoryItem): Promise<HistoryItem[]>} addToHistory - Add item to history
 * @property {function(userId: string|null, character: string): Promise<HistoryItem[]>} removeFromHistory - Remove item from history
 * @property {function(userId: string|null): Promise<HistoryItem[]>} clearHistory - Clear all history
 */
```

## Provider Implementations

### Firebase Provider

```javascript
// providers/firebase.js

export const firebaseAuth = {
  async signIn() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return mapFirebaseUser(result.user);
  },

  async signOut() {
    await firebaseSignOut(auth);
  },

  getCurrentUser() {
    return auth.currentUser ? mapFirebaseUser(auth.currentUser) : null;
  },

  onAuthStateChanged(callback) {
    return firebaseOnAuthStateChanged(auth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  }
};

export const firebaseStorage = {
  async getHistory(userId) {
    if (!userId) return localProvider.getHistory();
    const snapshot = await getDocs(collection(db, 'users', userId, 'history'));
    return snapshot.docs.map(doc => doc.data());
  },

  async addToHistory(userId, item) {
    if (!userId) return localProvider.addToHistory(null, item);
    await setDoc(doc(db, 'users', userId, 'history', item.character), item);
    return this.getHistory(userId);
  },

  async removeFromHistory(userId, character) {
    if (!userId) return localProvider.removeFromHistory(null, character);
    await deleteDoc(doc(db, 'users', userId, 'history', character));
    return this.getHistory(userId);
  }
};
```

### Local Provider (Fallback)

```javascript
// providers/local.js

const STORAGE_KEY = 'kanji-history';

export const localAuth = {
  async signIn() { throw new Error('Local auth not supported'); },
  async signOut() { /* no-op */ },
  getCurrentUser() { return null; },
  onAuthStateChanged(callback) { callback(null); return () => {}; }
};

export const localStorage = {
  async getHistory() {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async addToHistory(userId, item) {
    const history = await this.getHistory();
    const filtered = history.filter(h => h.character !== item.character);
    const updated = [item, ...filtered].slice(0, 100); // Limit 100 for anonymous
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  },

  async removeFromHistory(userId, character) {
    const history = await this.getHistory();
    const updated = history.filter(h => h.character !== character);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
};
```

## Data Flow

### Authentication Flow

```
┌──────────┐    Click     ┌──────────┐   signIn()   ┌──────────┐
│  User    │ ──────────▶  │    UI    │ ──────────▶  │   Auth   │
└──────────┘  "ログイン"   └──────────┘              │  Service │
                                                     └────┬─────┘
                                                          │
                          ┌───────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Provider (Firebase) │
              │   - Google OAuth      │
              │   - Return user info  │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  onAuthStateChanged   │
              │  - Update UI          │
              │  - Migrate local data │
              │  - Load cloud history │
              └───────────────────────┘
```

### Storage Flow (Authenticated)

```
┌──────────┐   Save      ┌──────────┐  addToHistory  ┌──────────┐
│  User    │ ─────────▶  │    UI    │ ────────────▶  │ Storage  │
└──────────┘  "保存"     └──────────┘    (userId)    │ Service  │
                                                      └────┬─────┘
                                                           │
                          ┌────────────────────────────────┘
                          │ userId !== null
                          ▼
              ┌───────────────────────┐
              │   Firestore           │
              │   /users/{uid}/       │
              │     /history/{char}   │
              └───────────────────────┘
```

### Storage Flow (Anonymous)

```
┌──────────┐   Save      ┌──────────┐  addToHistory  ┌──────────┐
│  User    │ ─────────▶  │    UI    │ ────────────▶  │ Storage  │
└──────────┘  "保存"     └──────────┘    (null)      │ Service  │
                                                      └────┬─────┘
                                                           │
                          ┌────────────────────────────────┘
                          │ userId === null
                          ▼
              ┌───────────────────────┐
              │   localStorage        │
              │   key: 'kanji-history'│
              │   limit: 100 items    │
              └───────────────────────┘
```

## Data Migration

When a user signs in for the first time, local history should be migrated to cloud storage:

```javascript
async function migrateLocalToCloud(userId) {
  const localHistory = await localProvider.getHistory();

  if (localHistory.length === 0) return;

  // Batch write to Firestore
  const batch = writeBatch(db);
  for (const item of localHistory) {
    const ref = doc(db, 'users', userId, 'history', item.character);
    batch.set(ref, item, { merge: true });
  }
  await batch.commit();

  // Clear local storage after successful migration
  window.localStorage.removeItem(STORAGE_KEY);
}
```

## Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/history/{character} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Configuration

```javascript
// config.js
export const AUTH_PROVIDER = 'firebase'; // 'firebase' | 'supabase'
export const STORAGE_PROVIDER = 'firebase'; // 'firebase' | 'supabase' | 'local'

// Firebase configuration (from Firebase Console)
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## UI Components

### Login Button States

| State | Display | Action |
|-------|---------|--------|
| Not logged in | "ログイン" button | Trigger signIn() |
| Logging in | Spinner/disabled | Wait |
| Logged in | User avatar + "ログアウト" | Trigger signOut() |

### Benefits Banner (for anonymous users)

```html
<div class="login-prompt">
  <p>ログインすると:</p>
  <ul>
    <li>100件以上保存可能</li>
    <li>他のデバイスでも閲覧可能</li>
  </ul>
  <button>Googleでログイン</button>
</div>
```

## File Structure

```
src/
├── services/
│   ├── auth.js           # Auth service (selects provider)
│   ├── storage.js        # Storage service (selects provider)
│   └── providers/
│       ├── firebase.js   # Firebase implementation
│       ├── supabase.js   # Supabase implementation (future)
│       └── local.js      # localStorage implementation
├── config.js             # Provider configuration
├── main.js               # Updated with auth integration
└── ...
```

## Future: Supabase Migration

To migrate to Supabase:

1. Create `providers/supabase.js` implementing the same interfaces
2. Update `config.js` to set `AUTH_PROVIDER = 'supabase'`
3. No changes needed in application code (main.js, UI components)

```javascript
// providers/supabase.js (future implementation)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const supabaseAuth = {
  async signIn() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    // ...
  },
  // ... rest of implementation
};
```
