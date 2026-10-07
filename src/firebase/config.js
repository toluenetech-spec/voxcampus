import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Values can be overridden per-environment with a .env file (see .env.example).
// The checked-in defaults keep the hosted project working out of the box.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCKCj16w2-pFm5NcaO7cSSYHvhZqookCz0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'voxcampus01.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'voxcampus01',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'voxcampus01.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '924044006135',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:924044006135:web:f5d52de176a25b29c5f9f2',
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
}

export { app, auth, db, googleProvider, firebaseConfig, isFirebaseConfigured };
