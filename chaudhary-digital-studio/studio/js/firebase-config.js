/* ============================================================
   FIREBASE CONFIG — replace these with your own project's keys.
   See README.md for step-by-step instructions on where to find
   these values in the Firebase console.
   ============================================================ */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Until the real config is entered, this flag lets every other
// script show a clean "setup in progress" state instead of
// scattering try/catch checks everywhere.
const FIREBASE_NOT_CONFIGURED = firebaseConfig.apiKey === "YOUR_API_KEY";

let app, auth, db, storage;
if (!FIREBASE_NOT_CONFIGURED) {
  try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    storage = firebase.storage();
  } catch (e) {
    console.error("Firebase init failed:", e);
  }
}
