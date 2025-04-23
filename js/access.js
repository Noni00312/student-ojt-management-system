import { auth, db, onAuthStateChanged, getDoc, doc } from "./firebase-config.js";

// Function to check user type and enforce access control
function checkUserAccess() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user document from students collection
      const userDocRef = doc(db, "students", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const currentPage = window.location.pathname.split('/').pop();

        // Allowed pages for admin
        const adminAllowedPages = [
          'admin-assistant-report',
          'admin-assistant',
          'admin-company.html',
          'admin-incident-report.html',
          'admin-student-report.html',
          'admin-student.html',
          'admin-dashboard.html', 
          
        ];

        // Allowed pages for regular users
        const userAllowedPages = [
          'dashboard.html',
          'profile.html',
          'company.html'
        ];

        // If user is ADMIN
        if (userData.userType === 'admin') {
          // Redirect if trying to access non-admin pages
          if (!adminAllowedPages.includes(currentPage)) {
            window.location.href = 'access-denied.html';
          }
        } 
        // If user is REGULAR USER
        else if (userData.userType === 'student' || 'studentAssistant') {
          // Redirect if trying to access admin pages or pages not in userAllowedPages
          if (adminAllowedPages.includes(currentPage) || !userAllowedPages.includes(currentPage)) {
            window.location.href = 'access-denied.html';
          }
        }
        // If user type is not recognized
        else {
          console.log("Unknown user type");
          window.location.href = 'access-denied.html';
        }
      } else {
        console.log("User document not found");
        window.location.href = 'access-denied.html';
      }
    } else {
      // User not logged in, redirect to login
      window.location.href = 'login.html';
    }
  });
}

// Call the function when the script loads
checkUserAccess();

// Also check when route changes
window.addEventListener('popstate', checkUserAccess);