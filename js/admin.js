// Admin Panel Module — uses the isolated admin Firebase app
import { adminAuth, adminDb, collections } from './firebase-admin.js';
import { addProduct, updateProduct } from './products.js';
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  collection, getDoc, onSnapshot, updateDoc, deleteDoc,
  doc, query, orderBy, addDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Auth guard — uses adminAuth, not the customer auth ──
onAuthStateChanged(adminAuth, async (user) => {
  if (!user) {
    window.location.replace('admin-login.html');
    return;
  }

  const adminUser = await isAdmin(user.uid);
  if (!adminUser) {
    await signOut(adminAuth);
    window.location.replace('admin-login.html');
    return;
  }

  showAdminUI(user);
  initAdminTabs();
  loadAdminData();
  initProductForm();
  initTestimonialForm();
  initChangePassword();
});

async function isAdmin(uid) {
  try {
    const snap = await getDoc(doc(adminDb, collections.users, uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch { return false; }
}

// ── Show dashboard ──
function showAdminUI(user) {
  const emailEl = document.getElementById('adminEmail');
  if (emailEl) emailEl.textContent = user.email;

  const dashboard = document.getElementById('adminDashboard');
  if (dashboard) dashboard.style.display = 'block';

  const loader = document.getElementById('adminLoader');
  if (loader) loader.style.display = 'none';
}

// ── Logout — only signs out the admin session ──
window.adminLogout = async () => {
  await signOut(adminAuth);
  window.location.replace('admin-login.html');
};

// ── Tab switching ──
function initAdminTabs() {
  document.querySelectorAll('.admin-nav button[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelector('.admin-nav button.active')?.classList.remove('active');
      tab.classList.add('active');
      document.querySelector('.admin-section.active')?.classList.remove('active');
      document.getElementById(tab.dataset.tab)?.classList.add('active');
    });
  });
}

// ── Real-time listeners ──
function loadAdminData() {
  onSnapshot(collection(adminDb, collections.products), snap => {
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window._adminProducts = items; // store for edit lookup
    renderProductsTable(items);
    const el = document.getElementById('statProducts');
    if (el) el.textContent = snap.size;
  });

  onSnapshot(
    query(collection(adminDb, collections.orders), orderBy('createdAt', 'desc')),
    snap => {
      renderOrdersTable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      const el = document.getElementById('statOrders');
      if (el) el.textContent = snap.size;
    }
  );

  onSnapshot(collection(adminDb, collections.users), snap => {
    renderUsersTable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    const el = document.getElementById('statUsers');
    if (el) el.textContent = snap.size;
  });

  onSnapshot(collection(adminDb, collections.testimonials), snap =>
    renderTestimonialsCards(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );

  onSnapshot(
    query(collection(adminDb, collections.bookings), orderBy('createdAt', 'desc')),
    snap => {
      renderBookingsTable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      const el = document.getElementById('statBookings');
      if (el) el.textContent = snap.size;
    }
  );

  onSnapshot(collection(adminDb, collections.messages), snap => {
    renderMessagesTable(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    const el = document.getElementById('statMessages');
    if (el) el.textContent = snap.size;
  });
}

// ── Products table ──
function renderProductsTable(items) {
  const tbody = document.getElementById('productsTable');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#888;">No products yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>${item.image ? `<img src="${item.image}" width="44" height="44" style="border-radius:8px;object-fit:cover;">` : '—'}</td>
      <td style="font-weight:500;">${item.name || '—'}</td>
      <td><span style="font-size:0.8rem;background:rgba(0,0,0,0.06);padding:0.2rem 0.6rem;border-radius:20px;">${item.category || '—'}</span></td>
      <td style="font-weight:600;">$${parseFloat(item.price || 0).toFixed(2)}</td>
      <td>
        <button class="action-btn btn-edit" onclick="window.editProduct('${item.id}')">Edit</button>
        <button class="action-btn btn-delete" onclick="window.confirmDeleteProduct('${item.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ── Orders table ──
function renderOrdersTable(items) {
  const tbody = document.getElementById('ordersTable');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888;">No orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-weight:500;">${item.name || '—'}</td>
      <td>${item.phone || '—'}</td>
      <td style="font-weight:600;">$${parseFloat(item.total || 0).toFixed(2)}</td>
      <td style="font-size:0.85rem;color:#777;">${item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
      <td><span class="status-${item.status || 'pending'}">${item.status || 'pending'}</span></td>
      <td>
        <select onchange="window.updateOrderStatus('${item.id}', this.value)"
          style="padding:0.35rem 0.6rem;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-family:inherit;font-size:0.85rem;cursor:pointer;">
          <option value="pending"   ${item.status === 'pending'   ? 'selected' : ''}>Pending</option>
          <option value="ongoing"   ${item.status === 'ongoing'   ? 'selected' : ''}>Ongoing</option>
          <option value="confirmed" ${item.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="delivered" ${item.status === 'delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
    </tr>
  `).join('');
}

// ── Users table — with Block / Unblock / Delete ──
function renderUsersTable(items) {
  const tbody = document.getElementById('usersTable');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#888;">No users yet.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => {
    const isAdminRole   = item.role === 'admin';
    const isDeletedRole = item.role === 'deleted';
    const isBlocked     = item.status === 'blocked';

    const roleBadge = `<span style="font-size:0.78rem;background:${isAdminRole ? '#111' : 'rgba(0,0,0,0.06)'};
      color:${isAdminRole ? '#fff' : '#555'};padding:0.2rem 0.7rem;border-radius:20px;">
      ${item.role || 'customer'}</span>`;

    const statusBadge = isDeletedRole
      ? `<span style="font-size:0.78rem;background:#F3F4F6;color:#6B7280;padding:0.2rem 0.7rem;border-radius:20px;font-weight:600;">Deleted</span>`
      : isBlocked
        ? `<span style="font-size:0.78rem;background:#FEE2E2;color:#dc2626;padding:0.2rem 0.7rem;border-radius:20px;font-weight:600;">Blocked</span>`
        : `<span style="font-size:0.78rem;background:#D1FAE5;color:#065F46;padding:0.2rem 0.7rem;border-radius:20px;font-weight:600;">Active</span>`;

    // No actions for admin accounts
    // Deleted accounts get a "Remove" button to permanently delete the Firestore doc
    const actions = isAdminRole
      ? '<span style="color:#aaa;font-size:0.8rem;">—</span>'
      : isDeletedRole
        ? `<button class="action-btn btn-delete" onclick="window.permanentlyRemoveUser('${item.id}', '${item.email}')">
             Remove
           </button>`
        : `
      <button class="action-btn" onclick="window.toggleBlockUser('${item.id}', ${isBlocked})"
        style="background:${isBlocked ? '#2563EB' : '#F59E0B'};color:#fff;border:none;margin-right:4px;">
        ${isBlocked ? 'Unblock' : 'Block'}
      </button>
      <button class="action-btn btn-delete" onclick="window.deleteUserAccount('${item.id}', '${item.email}')">
        Delete
      </button>`;

    return `
      <tr style="${isBlocked ? 'opacity:0.65;' : ''}">
        <td>
          <div style="font-weight:500;color:#111;">${item.name || item.email?.split('@')[0] || '—'}</div>
          <div style="font-size:0.78rem;color:#888;">${item.email || '—'}</div>
        </td>
        <td>${item.phone || '—'}</td>
        <td>${item.country || '—'}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>${actions}</td>
      </tr>`;
  }).join('');
}

// ── Testimonials cards ──
function renderTestimonialsCards(items) {
  const container = document.getElementById('testimonialsCards');
  if (!container) return;
  container.className = 'testimonials-grid';
  if (!items.length) {
    container.innerHTML = '<p style="color:#888;padding:2rem;grid-column:1/-1;text-align:center;">No testimonials yet.</p>';
    return;
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = items.map(item => {
    const rating = parseInt(item.rating) || 5;
    const stars  = Array.from({ length: 5 }, (_, i) =>
      `<svg width="14" height="14" viewBox="0 0 24 24"
        fill="${i < rating ? '#F59E0B' : 'none'}"
        stroke="${i < rating ? '#D97706' : '#D1D5DB'}"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`
    ).join('');
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
      : '—';
    const avatar = item.photo
      ? `<img src="${item.photo}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" alt="${item.name}">`
      : `<div style="width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.08);display:flex;align-items:center;justify-content:center;font-weight:600;font-size:0.9rem;color:#555;">${(item.name||'?')[0].toUpperCase()}</div>`;

    return `
      <div style="background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);border:1px solid rgba(0,0,0,0.08);
                  border-radius:16px;padding:1.5rem;box-shadow:0 4px 20px rgba(0,0,0,0.06);position:relative;">
        <button onclick="window.confirmDeleteTestimonial('${item.id}')"
          style="position:absolute;top:1rem;right:1rem;background:none;border:1px solid rgba(0,0,0,0.12);
                 border-radius:8px;padding:0.3rem 0.6rem;cursor:pointer;font-size:0.78rem;color:#999;transition:all 0.2s;"
          onmouseover="this.style.background='#111';this.style.color='#fff'"
          onmouseout="this.style.background='none';this.style.color='#999'">Delete</button>
        <div style="margin-bottom:0.8rem;">${stars}</div>
        <p style="color:#333;line-height:1.7;font-size:0.95rem;margin-bottom:1.2rem;padding-right:3rem;">"${item.message}"</p>
        <div style="display:flex;align-items:center;gap:0.8rem;border-top:1px solid rgba(0,0,0,0.06);padding-top:1rem;">
          ${avatar}
          <div>
            <div style="font-weight:600;color:#111;font-size:0.9rem;">${item.name || '—'}</div>
            <div style="font-size:0.78rem;color:#aaa;">${date}</div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Bookings table ──
function renderBookingsTable(items) {
  const tbody = document.getElementById('bookingsTable');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#888;">No bookings yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => {
    const submitted  = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
      : '—';
    const apptDate   = item.date
      ? new Date(item.date).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
      : '—';
    const serviceType  = item.serviceType || '—';
    const statusLabel  = item.bookingStatus || 'pending';
    const statusColors = {
      pending:   'background:#FEF3C7;color:#92400E',
      confirmed: 'background:#DBEAFE;color:#1E40AF',
      completed: 'background:#D1FAE5;color:#065F46',
      cancelled: 'background:#FEE2E2;color:#dc2626'
    };
    const badgeStyle = statusColors[statusLabel] || statusColors.pending;

    return `
      <tr>
        <td>
          <div style="font-weight:600;color:#111;">${item.name || '—'}</div>
          <div style="font-size:0.75rem;color:#888;">${item.phone || '—'}</div>
        </td>
        <td style="white-space:nowrap;font-size:0.85rem;">${apptDate}</td>
        <td>
          <span style="font-size:0.75rem;${badgeStyle};padding:0.2rem 0.6rem;border-radius:20px;font-weight:600;white-space:nowrap;">
            ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}
          </span>
        </td>
        <td>
          <span style="font-size:0.78rem;background:rgba(37,99,235,0.08);color:#2563EB;padding:0.2rem 0.6rem;border-radius:20px;font-weight:600;white-space:nowrap;">
            ${serviceType}
          </span>
        </td>
        <td style="max-width:180px;color:#555;font-size:0.82rem;">
          ${(item.notes || '—').substring(0, 55)}${(item.notes || '').length > 55 ? '…' : ''}
        </td>
        <td style="font-size:0.8rem;color:#aaa;white-space:nowrap;">${submitted}</td>
        <td>
          <select onchange="window.updateBookingStatus('${item.id}', this.value)"
            style="padding:0.3rem 0.5rem;border:1px solid rgba(0,0,0,0.15);border-radius:8px;font-family:inherit;font-size:0.8rem;cursor:pointer;">
            <option value="pending"   ${statusLabel === 'pending'   ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${statusLabel === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${statusLabel === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${statusLabel === 'cancelled' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <button class="action-btn btn-delete" onclick="window.deleteBooking('${item.id}', '${(item.name || '').replace(/'/g, '')}')">
            Delete
          </button>
        </td>
      </tr>`;
  }).join('');
}

// ── Messages table ──
function renderMessagesTable(items) {
  const tbody = document.getElementById('messagesTable');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#888;">No messages yet.</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td>
        <div style="font-weight:600;color:#111;">${item.name || '—'}</div>
        <div style="font-size:0.75rem;color:#888;">${item.phone || ''}</div>
      </td>
      <td style="font-size:0.85rem;">${item.email || '—'}</td>
      <td style="max-width:260px;color:#555;font-size:0.85rem;">${(item.message||'').substring(0,90)}${(item.message||'').length>90?'…':''}</td>
      <td style="font-size:0.82rem;color:#aaa;white-space:nowrap;">${item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '—'}</td>
      <td>
        <button class="action-btn btn-delete" onclick="window.deleteMessage('${item.id}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ── Add product form ──
function initProductForm() {
  document.getElementById('addProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Adding...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      await addProduct(fd.get('name'), fd.get('category'), fd.get('description'), fd.get('price'), fd.get('image'), adminDb);
      e.target.reset();
      document.getElementById('addProductModal').classList.remove('open');
      showAdminToast('Product added');
    } catch (err) { alert('Error: ' + err.message); }
    finally { btn.textContent = orig; btn.disabled = false; }
  });

  // ── Edit product form ──
  document.getElementById('editProductForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const fd      = new FormData(e.target);
      const id      = document.getElementById('editProductId').value;
      const imageFile = fd.get('editImage');
      const updates = {
        name:        fd.get('name'),
        category:    fd.get('category'),
        description: fd.get('description'),
        price:       parseFloat(fd.get('price'))
      };
      await updateProduct(id, updates, imageFile && imageFile.size > 0 ? imageFile : null, adminDb);
      document.getElementById('editProductModal').classList.remove('open');
      showAdminToast('Product updated');
    } catch (err) { alert('Error: ' + err.message); }
    finally { btn.textContent = orig; btn.disabled = false; }
  });
}

// ── Add testimonial form ──
function initTestimonialForm() {
  document.getElementById('addTestimonialForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Saving...'; btn.disabled = true;
    try {
      const fd = new FormData(e.target);
      await addDoc(collection(adminDb, collections.testimonials), {
        name: fd.get('name'), message: fd.get('message'),
        rating: parseInt(fd.get('rating')), photo: '',
        createdAt: new Date().toISOString()
      });
      e.target.reset();
      document.getElementById('addTestimonialModal').classList.remove('open');
      showAdminToast('Testimonial added');
    } catch (err) { alert('Error: ' + err.message); }
    finally { btn.textContent = orig; btn.disabled = false; }
  });
}

// ── Change password ──
function initChangePassword() {
  const form = document.getElementById('changePasswordForm');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('currentPassword').value;
    const newPwd     = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmPassword').value;
    const errEl      = document.getElementById('pwdError');
    const okEl       = document.getElementById('pwdSuccess');
    errEl.style.display = 'none'; okEl.style.display = 'none';

    if (newPwd.length < 6) { errEl.textContent = 'New password must be at least 6 characters.'; errEl.style.display = 'block'; return; }
    if (newPwd !== confirmPwd) { errEl.textContent = 'Passwords do not match.'; errEl.style.display = 'block'; return; }

    const btn = form.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Updating...'; btn.disabled = true;
    try {
      const user = adminAuth.currentUser;
      const cred = EmailAuthProvider.credential(user.email, currentPwd);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPwd);
      form.reset();
      okEl.textContent = 'Password updated successfully.'; okEl.style.display = 'block';
      showAdminToast('Password changed');
      setTimeout(() => { document.getElementById('changePasswordModal').classList.remove('open'); okEl.style.display = 'none'; }, 1500);
    } catch (err) {
      const code = err.code || '';
      errEl.textContent = (code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        ? 'Current password is incorrect.' : err.message;
      errEl.style.display = 'block';
    } finally { btn.textContent = orig; btn.disabled = false; }
  });
}

// ─────────────────────────────────────────────
// ── Global window actions ──
// ─────────────────────────────────────────────

window.updateOrderStatus = async (id, status) => {
  try {
    await updateDoc(doc(adminDb, collections.orders, id), { status });
    showAdminToast('Order status updated');
  } catch (err) { alert('Error: ' + err.message); }
};

window.updateBookingStatus = async (id, bookingStatus) => {
  try {
    await updateDoc(doc(adminDb, collections.bookings, id), { bookingStatus });
    showAdminToast('Booking status updated');
  } catch (err) { alert('Error: ' + err.message); }
};

window.deleteBooking = async (id, name) => {
  if (!confirm('Delete booking for ' + (name || 'this patient') + '? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(adminDb, collections.bookings, id));
    showAdminToast('Booking deleted');
  } catch (err) { alert('Error: ' + err.message); }
};

window.editProduct = (id) => {
  // Find product data
  const allSnap = window._adminProducts || [];
  const product = allSnap.find(p => p.id === id);
  if (!product) { showAdminToast('Product not found — refresh and try again'); return; }

  // Populate edit modal
  document.getElementById('editProductId').value    = id;
  document.getElementById('editProductName').value  = product.name || '';
  document.getElementById('editProductCat').value   = product.category || '';
  document.getElementById('editProductDesc').value  = product.description || '';
  document.getElementById('editProductPrice').value = product.price || '';
  const preview = document.getElementById('editImagePreview');
  if (product.image) { preview.src = product.image; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }

  document.getElementById('editProductModal').classList.add('open');
};

window.deleteMessage = async (id) => {
  if (!confirm('Delete this message? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(adminDb, collections.messages, id));
    showAdminToast('Message deleted');
  } catch (err) { alert('Error: ' + err.message); }
};

window.confirmDeleteProduct = async (id) => {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await deleteDoc(doc(adminDb, collections.products, id));
    showAdminToast('Product deleted');
  } catch (err) { alert('Error: ' + err.message); }
};

window.confirmDeleteTestimonial = async (id) => {
  if (!confirm('Delete this testimonial?')) return;
  try {
    await deleteDoc(doc(adminDb, collections.testimonials, id));
    showAdminToast('Testimonial deleted');
  } catch (err) { alert('Error: ' + err.message); }
};

// ── Block / Unblock user ──
window.toggleBlockUser = async (uid, currentlyBlocked) => {
  const action = currentlyBlocked ? 'unblock' : 'block';
  if (!confirm(`Are you sure you want to ${action} this user?`)) return;
  try {
    await updateDoc(doc(adminDb, collections.users, uid), {
      status: currentlyBlocked ? 'active' : 'blocked'
    });
    showAdminToast(`User ${action}ed`);
  } catch (err) { alert('Error: ' + err.message); }
};

// ── Delete user account ──
// We can't delete Firebase Auth accounts from the browser (requires Admin SDK).
// Instead we: 1) mark the Firestore doc as blocked+deleted so auth.js kicks them out,
// 2) strip all personal data from the doc so it's effectively wiped.
window.deleteUserAccount = async (uid, email) => {
  if (!confirm(
    'Delete account for ' + email + '?\n\n' +
    'This will permanently block them from logging in. ' +
    'They will NOT be able to create a new account with the same email.'
  )) return;

  try {
    // Overwrite the doc with a tombstone — strips all data, marks as deleted+blocked
    await updateDoc(doc(adminDb, collections.users, uid), {
      name: '[Deleted]',
      email: email,
      phone: '',
      country: '',
      secretCode: '',
      role: 'deleted',
      status: 'blocked',
      deletedAt: new Date().toISOString()
    });
    showAdminToast('Account for ' + email + ' deleted');
  } catch (err) {
    console.error('Delete error:', err);
    alert('Error deleting account: ' + err.message);
  }
};

// ── Permanently remove a tombstoned (deleted) user doc ──
window.permanentlyRemoveUser = async (uid, email) => {
  if (!confirm(
    'Permanently remove ' + email + ' from the system?\n\n' +
    'This cannot be undone.'
  )) return;

  try {
    await deleteDoc(doc(adminDb, collections.users, uid));
    showAdminToast('Record for ' + email + ' permanently removed');
  } catch (err) {
    console.error('Remove error:', err);
    alert('Error removing record: ' + err.message);
  }
};

// ── Toast ──
function showAdminToast(message) {
  let toast = document.getElementById('admin-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'admin-toast';
    toast.style.cssText =
      'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);' +
      'background:#111;color:#fff;padding:0.8rem 1.6rem;border-radius:12px;' +
      'font-size:0.9rem;font-family:inherit;z-index:9999;opacity:0;' +
      'transition:opacity 0.3s ease;pointer-events:none;white-space:nowrap;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2800);
}
