// Authentication Module
import { auth, db, collections } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  doc, getDoc, setDoc, collection, query, where, getDocs
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let currentUser = null;
let currentUserData = null;

// ── Auth state listener ──
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    try {
      const snap = await getDoc(doc(db, collections.users, user.uid));

      if (!snap.exists()) {
        // No Firestore doc — account was hard-deleted or never completed signup
        // Sign them out silently and redirect
        await signOut(auth);
        window.location.href = 'index.html';
        return;
      }

      currentUserData = snap.data();

      // Blocked or deleted accounts get signed out immediately
      if (currentUserData.status === 'blocked' || currentUserData.role === 'deleted') {
        await signOut(auth);
        alert('This account has been suspended or deleted. Please contact support.');
        window.location.href = 'index.html';
        return;
      }

    } catch { currentUserData = {}; }
  } else {
    currentUserData = null;
  }
  updateNavAuthState(user, currentUserData);
});

export function getCurrentUser()     { return currentUser; }
export function getCurrentUserData() { return currentUserData; }

// ─────────────────────────────────────────────
// ── Navbar profile UI ──
// ─────────────────────────────────────────────
function updateNavAuthState(user, userData) {
  // ── Desktop nav ──
  const loginLink  = document.querySelector('.nav-links a[href="login.html"]');
  const signupLink = document.querySelector('.nav-links a[href="signup.html"]');
  const navList    = loginLink?.closest('ul');

  if (navList && user) {
    loginLink?.parentElement?.remove();
    signupLink?.parentElement?.remove();

    if (!document.getElementById('profileDropdownWrap')) {
      const name    = userData?.name || user.email.split('@')[0];
      const initial = name[0].toUpperCase();

      const li = document.createElement('li');
      li.id = 'profileDropdownWrap';
      li.style.cssText = 'position:relative;list-style:none;';
      li.innerHTML = `
        <button id="profileBtn" aria-haspopup="true" aria-expanded="false"
          style="display:flex;align-items:center;gap:0.5rem;background:none;border:none;
                 cursor:pointer;font-family:inherit;font-size:0.9rem;font-weight:500;
                 color:#111;padding:0.3rem 0.6rem;border-radius:50px;transition:background 0.2s;"
          onmouseover="this.style.background='rgba(0,0,0,0.05)'"
          onmouseout="this.style.background='none'">
          <span style="width:34px;height:34px;border-radius:50%;
            background:linear-gradient(135deg,#2563EB,#0891b2);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-weight:700;font-size:0.9rem;flex-shrink:0;">
            ${initial}
          </span>
          <span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${name}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#777"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        <div id="profileDropdown" style="
          display:none;position:absolute;top:calc(100% + 10px);right:0;
          background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);
          border:1px solid rgba(0,0,0,0.1);border-radius:16px;
          box-shadow:0 12px 40px rgba(0,0,0,0.14);min-width:220px;
          padding:0.5rem;z-index:2000;">

          <div style="padding:0.8rem 1rem 0.6rem;border-bottom:1px solid rgba(0,0,0,0.07);margin-bottom:0.4rem;">
            <div style="font-weight:700;color:#111;font-size:0.95rem;">${name}</div>
            <div style="font-size:0.78rem;color:#888;margin-top:1px;">${user.email}</div>
            ${userData?.country ? '<div style="font-size:0.75rem;color:#aaa;margin-top:1px;">'+userData.country+'</div>' : ''}
          </div>

          <a href="shop.html" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Shop Pharmacy
          </a>
          <a href="cart.html" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>
            My Cart
          </a>
          <a href="profile.html" class="dropdown-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            My Profile
          </a>

          <div style="border-top:1px solid rgba(0,0,0,0.07);margin:0.4rem 0;"></div>

          <button onclick="window._authLogout()" class="dropdown-item"
            style="width:100%;text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;color:#dc2626;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>`;

      navList.appendChild(li);

      const btn      = li.querySelector('#profileBtn');
      const dropdown = li.querySelector('#profileDropdown');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dropdown.style.display === 'block';
        dropdown.style.display = open ? 'none' : 'block';
        btn.setAttribute('aria-expanded', String(!open));
      });

      document.addEventListener('click', () => {
        dropdown.style.display = 'none';
        btn.setAttribute('aria-expanded', 'false');
      });
    }
  }

  // ── Mobile nav — replace Login/Sign Up with profile info ──
  const mobileNav = document.getElementById('mobileNav');
  if (mobileNav && user) {
    const name    = userData?.name || user.email.split('@')[0];
    const initial = name[0].toUpperCase();

    // Update mobile avatar icon in navbar
    if (window._updateMobileAvatar) {
      window._updateMobileAvatar(initial, true);
    }

    // Remove existing login/signup links from mobile nav
    mobileNav.querySelectorAll('a[href="login.html"], a[href="signup.html"]').forEach(el => el.remove());

    // Remove old mobile profile block if exists
    const existing = mobileNav.querySelector('#mobileProfileBlock');
    if (existing) existing.remove();

    // Add profile block at top of mobile nav
    const profileBlock = document.createElement('div');
    profileBlock.id = 'mobileProfileBlock';
    profileBlock.style.cssText = 'margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid rgba(0,0,0,0.08);';
    profileBlock.innerHTML =
      '<div style="display:flex;align-items:center;gap:0.8rem;padding:0.5rem 1.2rem;">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#2563EB,#0891b2);' +
          'display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;flex-shrink:0;">' +
          initial +
        '</div>' +
        '<div>' +
          '<div style="font-weight:700;color:#111;font-size:0.95rem;">' + name + '</div>' +
          '<div style="font-size:0.75rem;color:#888;">' + user.email + '</div>' +
        '</div>' +
      '</div>';

    // Insert at top (after close button)
    const closeBtn = mobileNav.querySelector('.mobile-nav-close');
    if (closeBtn) {
      closeBtn.insertAdjacentElement('afterend', profileBlock);
    } else {
      mobileNav.prepend(profileBlock);
    }

    // Add profile & logout links if not already there
    if (!mobileNav.querySelector('a[href="profile.html"]')) {
      const profileLink = document.createElement('a');
      profileLink.href = 'profile.html';
      profileLink.textContent = 'My Profile';
      mobileNav.appendChild(profileLink);
    }

    if (!mobileNav.querySelector('#mobileLogoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'mobileLogoutBtn';
      logoutBtn.textContent = 'Logout';
      logoutBtn.style.cssText = 'color:#dc2626;margin-top:0.5rem;';
      logoutBtn.addEventListener('click', () => {
        window._authLogout();
      });
      mobileNav.appendChild(logoutBtn);
    }
  }
}

// Global logout callable from dropdown HTML
window._authLogout = () => {
  signOut(auth).then(() => window.location.href = 'index.html');
};

// ─────────────────────────────────────────────
// ── Signup ──
// ─────────────────────────────────────────────
export async function signup(email, password, phone, country, secretCode) {
  if (!/^\d{4}$/.test(secretCode)) throw new Error('Secret code must be exactly 4 digits.');

  const emailSnap = await getDocs(query(collection(db, collections.users), where('email', '==', email)));
  if (!emailSnap.empty) throw new Error('Email already registered.');

  const phoneSnap = await getDocs(query(collection(db, collections.users), where('phone', '==', phone)));
  if (!phoneSnap.empty) throw new Error('Phone number already registered.');

  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // Derive a display name from email
  const name = email.split('@')[0];

  await setDoc(doc(db, collections.users, user.uid), {
    name,
    email,
    phone,
    country,
    secretCode,
    createdAt: new Date().toISOString(),
    role: 'customer'
  });

  return user;
}

// ─────────────────────────────────────────────
// ── Login ──
// ─────────────────────────────────────────────
export async function login(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  // Check if account is blocked or deleted
  const snap = await getDoc(doc(db, collections.users, user.uid));

  if (!snap.exists()) {
    await signOut(auth);
    throw new Error('Account not found. Please sign up.');
  }

  const data = snap.data();
  if (data.status === 'blocked' || data.role === 'deleted') {
    await signOut(auth);
    throw new Error('This account has been suspended or deleted. Please contact support.');
  }

  return user;
}

// ─────────────────────────────────────────────
// ── Password reset ──
// ─────────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function recoverWithSecretCode(email, secretCode) {
  const snap = await getDocs(query(collection(db, collections.users), where('email', '==', email)));
  if (snap.empty) throw new Error('No account found with that email.');

  const data = snap.docs[0].data();
  if (data.secretCode !== secretCode) throw new Error('Incorrect secret code.');

  await sendPasswordResetEmail(auth, email);
  return true;
}

// ─────────────────────────────────────────────
// ── Logout ──
// ─────────────────────────────────────────────
export function logout() {
  return signOut(auth);
}

// ─────────────────────────────────────────────
// ── Auth guard for protected pages ──
// ─────────────────────────────────────────────
export function requireAuth(redirectUrl = 'login.html') {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) {
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.replace(redirectUrl);
      } else {
        resolve(user);
      }
    });
  });
}

// ─────────────────────────────────────────────
// ── DOM handlers for auth pages ──
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const resetForm  = document.getElementById('resetForm');

  // ── Login ──
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = loginForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('loginError');
      setLoading(btn, true, 'Signing in...');
      if (errEl) errEl.style.display = 'none';

      try {
        const email    = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        await login(email, password);
        const dest = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = dest;
      } catch (err) {
        setLoading(btn, false, 'Login');
        const msg = friendlyAuthError(err.code);
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        else alert(msg);
      }
    });
  }

  // ── Signup ──
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = signupForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('signupError');
      setLoading(btn, true, 'Creating account...');
      if (errEl) errEl.style.display = 'none';

      try {
        const email      = document.getElementById('signupEmail').value.trim();
        const password   = document.getElementById('signupPassword').value;
        const phone      = document.getElementById('signupPhone').value.trim();
        const country    = document.getElementById('signupCountry').value.trim();
        const secretCode = document.getElementById('signupSecretCode').value.trim();

        if (secretCode.length !== 4) throw new Error('Secret code must be exactly 4 digits.');

        await signup(email, password, phone, country, secretCode);

        // ── Redirect to home with welcome flag ──
        window.location.href = 'index.html?welcome=1';

      } catch (err) {
        setLoading(btn, false, 'Create Account');
        const msg = err.message || friendlyAuthError(err.code);
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        else alert(msg);
      }
    });
  }

  // ── Forgot password ──
  if (resetForm) {
    const tabEmail   = document.getElementById('tabEmail');
    const tabCode    = document.getElementById('tabCode');
    const panelEmail = document.getElementById('panelEmail');
    const panelCode  = document.getElementById('panelCode');

    if (tabEmail && tabCode) {
      tabEmail.addEventListener('click', () => {
        tabEmail.classList.add('active'); tabCode.classList.remove('active');
        panelEmail.style.display = 'block'; panelCode.style.display = 'none';
      });
      tabCode.addEventListener('click', () => {
        tabCode.classList.add('active'); tabEmail.classList.remove('active');
        panelCode.style.display = 'block'; panelEmail.style.display = 'none';
      });
    }

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = resetForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('resetError');
      const okEl  = document.getElementById('resetSuccess');
      setLoading(btn, true, 'Sending...');
      if (errEl) errEl.style.display = 'none';
      if (okEl)  okEl.style.display  = 'none';
      try {
        await resetPassword(document.getElementById('resetEmail').value.trim());
        setLoading(btn, false, 'Send Reset Link');
        if (okEl) { okEl.textContent = 'Reset link sent! Check your inbox.'; okEl.style.display = 'block'; }
      } catch (err) {
        setLoading(btn, false, 'Send Reset Link');
        if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
      }
    });

    const codeForm = document.getElementById('secretCodeForm');
    if (codeForm) {
      codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn   = codeForm.querySelector('button[type="submit"]');
        const errEl = document.getElementById('codeError');
        const okEl  = document.getElementById('codeSuccess');
        setLoading(btn, true, 'Verifying...');
        if (errEl) errEl.style.display = 'none';
        if (okEl)  okEl.style.display  = 'none';
        try {
          const email = document.getElementById('recoveryEmail').value.trim();
          const code  = document.getElementById('recoveryCode').value.trim();
          await recoverWithSecretCode(email, code);
          setLoading(btn, false, 'Verify Code');
          if (okEl) { okEl.textContent = 'Code verified! A password reset link has been sent to your email.'; okEl.style.display = 'block'; }
        } catch (err) {
          setLoading(btn, false, 'Verify Code');
          if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
        }
      });
    }
  }
});

// ── Helpers ──
function setLoading(btn, loading, text) {
  btn.disabled = loading;
  btn.textContent = text;
}

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':         'No account found with that email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/email-already-in-use':   'Email already registered.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
