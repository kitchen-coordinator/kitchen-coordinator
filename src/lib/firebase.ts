import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFirestore, type Firestore } from 'firebase/firestore';

function cleanEnv(v: string | undefined): string | null {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (!trimmed || trimmed.toLowerCase() === 'undefined') return null;
  return trimmed;
}

// IMPORTANT: These must be referenced directly so Next.js can inline them on the client.
const FIREBASE_ENV = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    FIREBASE_ENV.apiKey
      && FIREBASE_ENV.authDomain
      && FIREBASE_ENV.projectId
      && FIREBASE_ENV.storageBucket
      && FIREBASE_ENV.messagingSenderId
      && FIREBASE_ENV.appId,
  );
}

export type FirebaseClient = {
  app: FirebaseApp;
  auth: Auth;
  storage: FirebaseStorage;
  db: Firestore;
};

let cachedClient: FirebaseClient | null | undefined;

/**
 * Client-only, lazy Firebase init.
 * Returns null when running on the server or when env vars are missing.
 */
export function getFirebaseClient(): FirebaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!isFirebaseConfigured()) return null;

  if (cachedClient !== undefined) return cachedClient;

  const firebaseConfig = {
    apiKey: FIREBASE_ENV.apiKey!,
    authDomain: FIREBASE_ENV.authDomain!,
    projectId: FIREBASE_ENV.projectId!,
    storageBucket: FIREBASE_ENV.storageBucket!,
    messagingSenderId: FIREBASE_ENV.messagingSenderId!,
    appId: FIREBASE_ENV.appId!,
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  cachedClient = {
    app,
    auth: getAuth(app),
    storage: getStorage(app),
    db: getFirestore(app),
  };
  return cachedClient;
}

/**
 * Minimal auth for locked-down Firebase rules.
 * With Anonymous Auth enabled in Firebase Console, this will silently sign users in.
 */
export async function ensureFirebaseSignedIn(auth: Auth): Promise<void> {
  if (auth.currentUser) return;
  await signInAnonymously(auth);
}
