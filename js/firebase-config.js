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
  query,
  where,
  enableIndexedDbPersistence,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgmAZwLqyNldx-vEQlUXztFyvINWeD1yY",
  authDomain: "student-ojt-management-s-4580f.firebaseapp.com",
  projectId: "student-ojt-management-s-4580f",
  storageBucket: "student-ojt-management-s-4580f.appspot.com",
  messagingSenderId: "636983402790",
  appId: "1:636983402790:web:001c224269afe3f03e61e7",
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
  query,
  where,
};
