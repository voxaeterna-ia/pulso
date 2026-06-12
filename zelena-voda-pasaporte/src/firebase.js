import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJCtlXeddEZ__FDNDXk8Bz-SIWEqn0nqc",
  authDomain: "pasaporte-zelena.firebaseapp.com",
  projectId: "pasaporte-zelena",
  storageBucket: "pasaporte-zelena.firebasestorage.app",
  messagingSenderId: "1052513459788",
  appId: "1:1052513459788:web:21b94e6ae51deb5b1e5ee9",
  measurementId: "G-ZM0X61XE38"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
