import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Get Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyB7NyfdQKU6Q28Ut7H9wFeHYqELGwIChTY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "mbank-32d6d.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "mbank-32d6d",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "mbank-32d6d.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "941323560039",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:941323560039:web:16084fe9d0b3b186d2e0c2",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ZCJBDGT2EV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore Database
const db = getFirestore(app);

// Initialize Cloud Functions
const functions = getFunctions(app);

// Connect to Functions Emulator in development (optional)
// Uncomment this if you want to test with local emulator
// if (__DEV__ && process.env.EXPO_PUBLIC_APP_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export { auth, db, functions };
export default app;
