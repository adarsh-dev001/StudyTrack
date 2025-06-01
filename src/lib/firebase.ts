
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
// These values are expected to be in your .env.local or .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// CRITICAL PRE-INITIALIZATION CHECK:
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'CRITICAL FIREBASE CONFIGURATION ERROR: Firebase apiKey or projectId is missing or undefined.',
    'This usually means your environment variables are not loaded correctly.',
    'Please verify the following:',
    '1. Your .env file is at the ROOT of your project.',
    '2. All Firebase related environment variables in .env START WITH "NEXT_PUBLIC_". (e.g., NEXT_PUBLIC_FIREBASE_API_KEY).',
    '3. You have RESTARTED your Next.js development server after making changes to the .env file.',
    '4. The values in your .env file are correct and do not contain typos.',
    `Current apiKey used for initialization: ${firebaseConfig.apiKey}`,
    `Current projectId used for initialization: ${firebaseConfig.projectId}`
  );
  // Optionally, you could throw an error here to halt execution if config is critical
  // throw new Error("Firebase configuration is missing. App cannot start.");
}


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const authInstance: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
let analytics: Analytics | null = null;

// Initialize Analytics only on the client side
if (typeof window !== 'undefined') {
  if (firebaseConfig.measurementId) { // Only initialize if measurementId is provided
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.error("Firebase Analytics initialization error:", error);
    }
  } else {
    // console.warn("Firebase Analytics: measurementId is missing. Analytics will not be initialized.");
  }
}

// Set authentication persistence (client-side only)
if (typeof window !== 'undefined') {
  setPersistence(authInstance, browserLocalPersistence)
    .catch((error) => {
      console.error("Firebase: Error setting auth persistence:", error.code, error.message);
    });
}

export { app, authInstance as auth, db, analytics };
