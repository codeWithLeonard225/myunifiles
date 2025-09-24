// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";


const firebaseConfig = {
  apiKey: "AIzaSyB2Z9Yv3zaAqYv9kPAhX8wg2rBd2jFxKZc",
  authDomain: "myunifiles-e420c.firebaseapp.com",
  projectId: "myunifiles-e420c",
  storageBucket: "myunifiles-e420c.firebasestorage.app",
  messagingSenderId: "464921853319",
  appId: "1:464921853319:web:a2725a754341eecd17a722",
  measurementId: "G-34P3CDW013"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };
