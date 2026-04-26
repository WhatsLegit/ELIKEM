// Firebase Config
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDW8h8E0Pkyjcfn6dbc982DESlr2FKV4xQ",
  authDomain: "elikemdots-c95a8.firebaseapp.com",
  projectId: "elikemdots-c95a8",
  storageBucket: "elikemdots-c95a8.firebasestorage.app",
  messagingSenderId: "403122459246",
  appId: "1:403122459246:web:45f2db7afd605e86688c7f"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firestore collection names
export const collections = {
  products:     'products',
  testimonials: 'testimonials',
  orders:       'orders',
  users:        'users',
  bookings:     'bookings',
  businessApps: 'businessApps',
  messages:     'messages'
};
