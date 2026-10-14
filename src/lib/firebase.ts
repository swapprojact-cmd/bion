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

export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'health_checks', 'client'));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('offline') || message.includes('network')) {
      console.warn('Firestore is unreachable; check project configuration and network.');
      return false;
    }
    return true;
  }
}
