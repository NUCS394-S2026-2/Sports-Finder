import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "placeholder",
  authDomain: "placeholder.firebaseapp.com",
  projectId: "pickup-sports-demo",
  storageBucket: "placeholder.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:placeholder",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);