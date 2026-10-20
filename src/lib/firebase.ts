import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = import.meta.env;
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

const missing = Object.entries(firebaseConfig).filter(([, value]) => !value).map(([key]) => key);
if (missing.length) {
  throw new Error('Firebase is not configured. Set these Vite environment variables: ' +
    missing.map(key => ({
      apiKey: 'VITE_FIREBASE_API_KEY',
      authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
      projectId: 'VITE_FIREBASE_PROJECT_ID',
      storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'VITE_FIREBASE_APP_ID',
    } as Record<string, string>)[key]).join(', '));
}

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const databaseId = env.VITE_FIRESTORE_DATABASE_ID || '(default)';
export const db = databaseId === '(default)' ? getFirestore(app) : getFirestore(app, databaseId);
export const storage = getStorage(app);

export type FirestoreConnectionCheck =
  | { ok: true }
  | { ok: false; code: string; message: string };

function firestoreConnectionError(error: unknown): { code: string; message: string } {
  const rawCode = error && typeof error === 'object' && 'code' in error
    ? String((error as { code?: unknown }).code || '')
    : '';
  const code = rawCode.split('/').pop() || 'unknown';
  const message = code === 'permission-denied'
    ? 'Firestore denied the health-check read. Confirm the rules deployed to the configured named database.'
    : code === 'unavailable' || code === 'network-request-failed'
      ? 'Firestore could not be reached. Check the network, Firebase project, and database availability.'
      : code === 'not-found'
        ? 'The configured Firestore database was not found in this Firebase project.'
        : code === 'failed-precondition'
          ? 'Firestore rejected the request because the database or client configuration is not ready.'
          : error instanceof Error
            ? error.message
            : 'Unknown Firestore connection error.';
  return { code, message };
}

/** Performs a server read against the configured database; this checks connectivity, not all collection permissions. */
export async function checkFirestoreConnection(): Promise<FirestoreConnectionCheck> {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'health_checks', 'client'));
    return { ok: true };
  } catch (error) {
    const detail = firestoreConnectionError(error);
    console.error('Firestore connection check failed:', detail.code, error);
    return { ok: false, ...detail };
  }
}

export async function validateFirestoreConnection(): Promise<boolean> {
  const result = await checkFirestoreConnection();
  return result.ok;
}
