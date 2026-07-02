/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if we have at least the minimum required config
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (!isFirebaseConfigured) {
  const missing = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  console.warn(`[Firebase] Missing configuration for: ${missing.join(', ')}. Please check your Secrets in the Settings menu.`);
} else {
  console.log('[Firebase] Initializing with Project:', firebaseConfig.projectId);
  
  // Validation checks for potential Secret name collisions or misconfigurations
  const apiKey = firebaseConfig.apiKey || '';
  const appId = firebaseConfig.appId || '';
  
  if (apiKey.includes(':') && !appId.includes(':')) {
    console.warn('[Firebase] CRITICAL: Your API Key appears to contain an App ID (contains colons). Check if your VITE_FIREBASE_API_KEY and VITE_FIREBASE_APP_ID secrets are swapped or have identical names.');
  }
  
  if (appId.startsWith('AIza')) {
    console.warn('[Firebase] CRITICAL: Your App ID appears to contain an API Key (starts with AIza). Check if your VITE_FIREBASE_APP_ID and VITE_FIREBASE_API_KEY secrets are swapped or have identical names.');
  }

  if (firebaseConfig.messagingSenderId === firebaseConfig.measurementId && firebaseConfig.messagingSenderId) {
    console.warn('[Firebase] Warning: messagingSenderId and measurementId are identical. Check if your Secret names overlap (e.g., both starting with VITE_FIREBASE_ME...).');
  }
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, silent: boolean = false) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  
  console.error(`[Firestore ${operationType.toUpperCase()}] Error at ${path}:`, errInfo.error);
  
  if (!silent) {
    // Only log, don't throw to prevent app-wide crashes during initialization
    console.warn('[Firestore] App continuing after error. Check console for details.');
  }
  
  return errInfo;
}

export default app;
