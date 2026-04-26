# ELIKEM DOTS - Professional Healthcare & Pharmacy Website

## Features
- **Glassmorphism UI**: Modern transparent glass effects, smooth animations, responsive design
- **Firebase Integration**: Authentication, Firestore (products/orders/testimonials/etc.), Storage (images)
- **Pages**: Home, Shop (filters/search), Product details, Cart/Checkout, Services, Business opportunity, Auth (login/signup/reset), Admin dashboard (CRUD)
- **Dynamic**: Real-time products/testimonials/orders, cart localStorage → Firestore, category filters
- **Brand**: ELIKEM DOTS logo, medical colors (blue/green), WhatsApp integration

## Quick Start (No Firebase - Static View)
1. Open `index.html` in browser
2. View Glassmorphism, animations, responsive layout
3. Note: Dynamic features require Firebase config

## Firebase Setup (Full Functionality)
1. **Create Firebase Project**:
   - Go to [console.firebase.google.com](https://console.firebase.google.com)
   - New project → Enable Authentication (Email/Password)
   - Firestore Database (test mode initially → production rules)
   - Storage (for product/testimonial images)

2. **Get Config**:
   - Project Settings → Web app → Copy `firebaseConfig`

3. **Update Config**:
   ```
   js/firebase.js → paste your firebaseConfig object
   ```

4. **Firestore Collections** (Create manually or first doc auto-creates):
   - `products`: {name, category, description, price, image}
   - `testimonials`: {name, message, rating, photo?}
   - `orders`: {name, phone, email, address, items[], total, status, createdAt}
   - `users`: {email, phone, country, role, createdAt} (admin role for uid)
   - `bookings`, `businessApps`, `messages`

5. **Security Rules** (Firestore/Storage - Production):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /products/{doc} { allow read: if true; allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }
       match /orders/{doc} { allow read, write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; allow create: if true; }
       match /{document=**} { allow read, create: if request.auth != null; allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'; }
     }
   }
   ```
   Storage: Admin upload only.

6. **Admin User**:
   - Signup as admin email, then in Firestore set `users/{uid}/role: 'admin'`

7. **Test Flow**:
   - Admin: login → add products/images → see in shop
   - User: shop → add cart → checkout → order in admin
   - Submit testimonials/forms → real-time
   - Auth validation (unique email/phone)

## Deployment
```
npm i -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Customization
- Hero video: Replace video src (medical themed)
- Products: Add via admin (13 categories ready)
- VSCode image: Use as hero fallback `hero-video img src`
- Colors: CSS vars in style.css

## Structure
```
├── index.html (home)
├── shop.html, product.html, cart.html, checkout.html
├── services.html, business.html
├── login.html, signup.html, forgot-password.html
├── admin.html
├── css/ (style.css, admin.css)
├── js/ (8 modular files)
└── README.md, TODO.md
```

Premium, fully functional healthcare pharmacy website ready!
