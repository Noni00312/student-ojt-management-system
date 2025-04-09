// register 

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword,  sendEmailVerification, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBgmAZwLqyNldx-vEQlUXztFyvINWeD1yY",
    authDomain: "student-ojt-management-s-4580f.firebaseapp.com",
    projectId: "student-ojt-management-s-4580f",
    storageBucket: "student-ojt-management-s-4580f.firebasestorage.app",
    messagingSenderId: "636983402790",
    appId: "1:636983402790:web:001c224269afe3f03e61e7",
    measurementId: "G-GPSY1W9J6L"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = document.getElementById('email');
const password = document.getElementById('password-input');
const submitBtn = document.getElementById('submit');
const errorLabel = document.getElementById('error-label');
const loadingIndicator = document.querySelector('.preloader');

// submitBtn.addEventListener('click', (e) => {
//     e.preventDefault();
//     const emailValue = email.value;
//     const passwordValue = password.value;

//     createUserWithEmailAndPassword(auth, emailValue, passwordValue)
//         .then((userCredential) => { 
//             const user = userCredential.user;


//             sendEmailVerification(user)
//                 .then(() => {
//                     loadingIndicator.classList.remove('d-none');
//                     alert('Verification email sent. Please check your inbox.');
//                     const interval = setInterval(async () => {
//                         await user.reload();
//                         if(user.emailVerified) {
                            
//                             clearinterval(interval);
//                             onAuthStateChanged(auth, (currentUser) => {
//                                 if (currentUser) {
//                                     const userId = currentUser.uid;
//                                     localStorage.setItem('userId', userId);
//                                     loadingIndicator.classList.add('d-none');
//                                     window.location.href = '/pages/additional-info.html';
//                                 } else {
//                                     // throw new exception (console.log("No user is signed in."));
//                                 }
//                             });

//                         }
//                         console.log('load state');
//                     }, 2000)
//                 })
            
//             console.log("User registered:", user);  
//         })
//         .catch((error) => {
//             const errorCode = error.code;
//             if(errorCode === 'auth/invalid-email') {
//                 errorLabel.textContent = 'Invalid email address.';
//             }
//             else if(errorCode === 'auth/email-already-in-use') {
//                 errorLabel.textContent = 'Email already in use.';
//             }
//             else if(errorCode === 'auth/weak-password') {
//                 errorLabel.textContent = 'Weak password.';
//             }
//             else if(errorCode === 'auth/operation-not-allowed') {
//                 errorLabel.textContent = 'Operation not allowed.';
//             }
//             else if(errorCode === 'auth/too-many-requests') {
//                 errorLabel.textContent = 'Too many requests. Try again later.';
//             }
//             else {
//                 errorLabel.textContent = 'An unknown error occurred.';
//             }
//             errorLabel.classList.add('text-danger');
//         });
// });

// registerz`


submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const emailValue = email.value;
    const passwordValue = password.value;

    createUserWithEmailAndPassword(auth, emailValue, passwordValue)
        .then((userCredential) => { 
            const user = userCredential.user;
            console.log("User registered:", user);

            sendEmailVerification(user)
                .then(() => {
                    loadingIndicator.classList.remove('d-none');
                    alert('Verification email sent. Please check your inbox.');
                    
                    const intervalId = setInterval(async () => {
                        try {
                            await user.reload();
                            if(user.emailVerified) {
                                clearInterval(intervalId);  
                                
                                localStorage.setItem('userId', user.uid);
                                loadingIndicator.classList.add('d-none');
                                window.location.href = '/pages/additional-info.html';
                            }
                            console.log('Checking verification status...');
                        } catch (error) {
                            console.error('Error checking verification:', error);
                            clearInterval(intervalId);
                            loadingIndicator.classList.add('d-none');
                            errorLabel.textContent = 'Error verifying email. Please try again.';
                            errorLabel.classList.add('text-danger');
                        }
                    }, 2000);
                    
                    setTimeout(() => {
                        clearInterval(intervalId);
                        if (!user.emailVerified) {
                            loadingIndicator.classList.add('d-none');
                            errorLabel.textContent = 'Verification timeout. Please check your email.';
                            errorLabel.classList.add('text-danger');
                        }
                    }, 120000); // 2 minutes timeout
                })
                .catch((error) => {
                    console.error('Error sending verification email:', error);
                    errorLabel.textContent = 'Error sending verification email.';
                    errorLabel.classList.add('text-danger');
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            if(errorCode === 'auth/invalid-email') {
                errorLabel.textContent = 'Invalid email address.';
            }
            else if(errorCode === 'auth/email-already-in-use') {
                errorLabel.textContent = 'Email already in use.';
            }
            else if(errorCode === 'auth/weak-password') {
                errorLabel.textContent = 'Weak password.';
            }
            else if(errorCode === 'auth/operation-not-allowed') {
                errorLabel.textContent = 'Operation not allowed.';
            }
            else if(errorCode === 'auth/too-many-requests') {
                errorLabel.textContent = 'Too many requests. Try again later.';
            }
            else {
                errorLabel.textContent = 'An unknown error occurred.';
            }
            errorLabel.classList.add('text-danger');
        });
});