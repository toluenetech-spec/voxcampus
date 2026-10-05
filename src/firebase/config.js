import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKCj16w2-pFm5NcaO7cSSYHvhZqookCz0",
  authDomain: "voxcampus01.firebaseapp.com",
  projectId: "voxcampus01",
  storageBucket: "voxcampus01.firebasestorage.app",
  messagingSenderId: "924044006135",
  appId: "1:924044006135:web:f5d52de176a25b29c5f9f2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
