// Firebase Admin App — separate instance, session-only persistence
// so closing the browser always requires re-login
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getAuth,
  setPersistence,
  browserSessionPersistence
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDW8h8E0Pkyjcfn6dbc982DESlr2FKV4xQ",
  authDomain: "elikemdots-c95a8.firebaseapp.com",
  projectId: "elikemdots-c95a8",
  storageBucket: "elikemdots-c95a8.firebasestorage.app",
  messagingSenderId: "403122459246",
  appId: "1:403122459246:web:45f2db7afd605e86688c7f"
};

const ADMIN_APP_NAME = 'admin-app';

const adminApp = getApps().find(a => a.name === ADMIN_APP_NAME)
  || initializeApp(firebaseConfig, ADMIN_APP_NAME);

export const adminAuth = getAuth(adminApp);
export const adminDb   = getFirestore(adminApp);

// SESSION persistence — auth is cleared when the browser/tab is closed.
// Admin must log in again every new session.
setPersistence(adminAuth, browserSessionPersistence).catch(console.error);

export const collections = {
  products:     'products',
  testimonials: 'testimonials',
  orders:       'orders',
  users:        'users',
  bookings:     'bookings',
  businessApps: 'businessApps',
  messages:     'messages'
};
