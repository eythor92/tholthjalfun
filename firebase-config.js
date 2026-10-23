// ─────────────────────────────────────────────────────────────
// Firebase-stillingar fyrir Þolþjálfun
// Sjá README.md, skref 2 og 5.
// ─────────────────────────────────────────────────────────────

// 1) Stillingar úr Firebase (Project settings → Your apps).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBnDk19GnY3hdRYWq2Xn05Cgk46k1GK4A4",
  authDomain: "tholthjalfun-6318a.firebaseapp.com",
  projectId: "tholthjalfun-6318a",
  storageBucket: "tholthjalfun-6318a.firebasestorage.app",
  messagingSenderId: "266216549581",
  appId: "1:266216549581:web:7e3e3c9145d36d0817cd84"
};

// 2) Google-netfangið sem þú skráir þig inn með sem þjálfari.
//    Sama netfang þarf líka að fara í reglurnar (firestore.rules).
window.COACH_EMAILS = ["eythor1992@gmail.com"];
