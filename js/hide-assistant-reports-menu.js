

import { firebaseCRUD } from './firebase-crud.js';

function getUserTypeFromIndexedDB(userId) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('SOJTMSDB', 1);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['studentInfoTbl'], 'readonly');
            const store = transaction.objectStore('studentInfoTbl');
            const index = store.index('userId');
            const getUser = index.get(userId);

            getUser.onsuccess = function () {
                if (getUser.result && getUser.result.userType) {
                    resolve(getUser.result.userType);
                } else {
                    resolve(null);
                }
            };
            getUser.onerror = function () {
                resolve(null);
            };
        };
        request.onerror = () => resolve(null);
    });
}

async function getUserTypeFromFirebase(userId) {
    try {
        const students = await firebaseCRUD.queryData('students', 'userId', '==', userId);
        if (students && students.length > 0 && students[0].userType) {
            return students[0].userType;
        }
    } catch (err) {
    }
    return null;
}

export async function hideAssistantReportsNavIfNotAssistant() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    if (window.dbReady) {
        try { await window.dbReady; } catch (e) {/*ignore*/} 
    }

    const navLi = document.getElementById('assistant-reports-nav');
    if (!navLi) return;

    const navDd = document.getElementById('assistant-reports-dd');
    if (!navDd) return;

    const [indexedDBType, firebaseType] = await Promise.all([
        getUserTypeFromIndexedDB(userId),
        getUserTypeFromFirebase(userId)
    ]);

    const isStudentAssistant = 
         firebaseType === "studentAssistant";

    if (!isStudentAssistant) {
        navLi.style.display = 'none';
        navDd.style.display = 'none';
    } else {
        navLi.style.display = '';
        navDd.style.display = '';
    }
}

document.addEventListener('DOMContentLoaded', hideAssistantReportsNavIfNotAssistant);