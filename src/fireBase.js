import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  ***REMOVED***: "AIzaSyApdnXtKrD7GOjD_g9m-hoXuBKLUDmhDtw",
  authDomain: "caloriestracking-8f63e.firebaseapp.com",
  projectId: "caloriestracking-8f63e",
  storageBucket: "caloriestracking-8f63e.appspot.com",
  messagingSenderId: "907336181185",
  appId: "1:907336181185:web:b734bfea7375c5de8bfb40",
  measurementId: "G-CP5GMH89MQ"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
