import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyC7WqpnKKCJHmr-hfEIO1ijY3E6aM4UDeE",
  authDomain: "ad-alm.firebaseapp.com",
  projectId: "ad-alm",
  storageBucket: "ad-alm.appspot.com",
  messagingSenderId: "124609724037",
  appId: "1:124609724037:web:e27800fcdd1770859073ec"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
