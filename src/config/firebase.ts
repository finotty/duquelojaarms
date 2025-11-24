import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfDMm4kQE4lrGzkhfeWQmcpgpCJhJrTIs",
  authDomain: "app-ip-2ffad.firebaseapp.com",
  projectId: "app-ip-2ffad",
  storageBucket: "app-ip-2ffad.firebasestorage.app",
  messagingSenderId: "685222959743",
  appId: "1:685222959743:web:27bfca2b75f5de8ec87d4a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 