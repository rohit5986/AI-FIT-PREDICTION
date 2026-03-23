import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, inMemoryPersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ''
};

const requiredConfigEntries = [
  ['EXPO_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['EXPO_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', firebaseConfig.storageBucket],
  ['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', firebaseConfig.messagingSenderId],
  ['EXPO_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId]
];

const isPlaceholderValue = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return !normalized || normalized.includes('your_') || normalized.includes('<') || normalized.includes('changeme');
};

const missingKeys = requiredConfigEntries
  .filter((entry) => isPlaceholderValue(entry[1]))
  .map((entry) => entry[0]);

export const isFirebaseConfigured = missingKeys.length === 0;

export const firebaseConfigError = isFirebaseConfigured
  ? ''
  : `Firebase is not configured. Missing: ${missingKeys.join(', ')}`;

let app = null;
let auth = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);

  try {
    auth = initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  } catch {
    auth = getAuth(app);
  }
}

export { app, auth };
