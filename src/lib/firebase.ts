
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence, onAuthStateChanged } from 'firebase/auth'; // Added browserLocalPersistence, setPersistence
import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage'; // Uncomment if you need Firebase Storage
// import { getFunctions } from 'firebase/functions'; // Uncomment if you need Firebase Functions

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Log the config object to help debug configuration issues
console.log('--- Firebase Configuration Check ---');
console.log('Attempting to load Firebase config from environment variables:');
console.log('NEXT_PUBLIC_FIREBASE_API_KEY value loaded:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN value loaded:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID value loaded:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET value loaded:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID value loaded:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log('NEXT_PUBLIC_FIREBASE_APP_ID value loaded:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
console.log('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID value loaded:', process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);
console.log('Complete firebaseConfig object constructed:', firebaseConfig);
console.log('------------------------------------');

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
    'Current apiKey used for initialization:', firebaseConfig.apiKey,
    'Current projectId used for initialization:', firebaseConfig.projectId
  );
  // You might want to throw an error here to halt further execution if critical config is missing
  // throw new Error("Firebase configuration is incomplete. App cannot initialize properly.");
}


// Initialize Firebase
let app;
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Only initialize if critical config is present
    app = initializeApp(firebaseConfig);
  } else {
    console.error("Firebase initialization skipped due to missing critical configuration (apiKey or projectId).");
    // App will not be initialized, and Firebase services will not work.
    // Assign a dummy object or handle this state appropriately in your app if needed.
    // For now, auth and db will be undefined or will error out if used.
  }
} else {
  app = getApp();
}

// Ensure app is defined before trying to get Auth or Firestore
const authInstance = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
// const storage = app ? getStorage(app) : null; // Uncomment if you need Firebase Storage
// const functions = app ? getFunctions(app) : null; // Uncomment if you need Firebase Functions

if (authInstance) {
  setPersistence(authInstance, browserLocalPersistence)
    .catch((error) => {
      console.error("Firebase: Error setting auth persistence:", error);
    });
} else if (!authInstance && app) { // Only log this specific warning if app was initialized but auth failed
    console.warn("Firebase Auth could not be initialized. This is likely due to the configuration error mentioned above, or setPersistence failed.");
}


export { app, authInstance as auth, db /*, storage, functions */ };
