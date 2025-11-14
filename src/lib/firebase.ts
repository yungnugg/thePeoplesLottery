// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCerSOmxPnsYY0PiVoE2a_ye-dTuvYoAjM",
  authDomain: "freem0neyhack.firebaseapp.com",
  projectId: "freem0neyhack",
  storageBucket: "freem0neyhack.firebasestorage.app",
  messagingSenderId: "1007966533935",
  appId: "1:1007966533935:web:e68531294dbd308d7c89da",
  measurementId: "G-41CF2TXC5G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };