import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  collectionGroup,
  query,
  where,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBFO9RbuzSsCGWi6YZElOFziCa3DfjuVJ8",
  authDomain: "sojtms.firebaseapp.com",
  projectId: "sojtms",
  storageBucket: "sojtms.firebasestorage.app",
  messagingSenderId: "599818378176",
  appId: "1:599818378176:web:65475abd4497cbde328625",
  measurementId: "G-VBJP0Q4V6W",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Offline persistence only works with one tab open");
  } else if (err.code === "unimplemented") {
    console.warn("Browser doesn't support offline persistence");
  }
});

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  getAuth,
  onAuthStateChanged,
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  collectionGroup,
  query,
  where,
};
