// Forms Module — Bookings and Contact Messages
import { db, collections } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {

  // ── Service booking form (services.html) ──
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = bookingForm.querySelector('button[type="submit"]');
      const orig = btn.textContent;
      btn.textContent = 'Booking...';
      btn.disabled = true;

      try {
        const data = Object.fromEntries(new FormData(bookingForm));
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, collections.bookings), data);
        bookingForm.reset();
        showFormFeedback(bookingForm, 'Appointment booked! We will contact you shortly.', 'success');
      } catch (err) {
        showFormFeedback(bookingForm, 'Could not submit. Please try again.', 'error');
      } finally {
        btn.textContent = orig;
        btn.disabled = false;
      }
    });
  }

  // ── Contact message form (index.html) ──
  // Handled directly in index.html script block — no duplicate handler here.

});

// ── Inline feedback helper ──
function showFormFeedback(form, message, type) {
  let el = form.querySelector('.form-feedback');
  if (!el) {
    el = document.createElement('p');
    el.className = 'form-feedback';
    el.style.cssText = 'text-align:center;margin-top:1rem;font-size:0.88rem;padding:0.6rem 1rem;border-radius:8px;';
    form.appendChild(el);
  }
  el.textContent = message;
  el.style.background = type === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';
  el.style.color       = type === 'success' ? '#16a34a' : '#dc2626';
  el.style.border      = type === 'success' ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(220,38,38,0.2)';
  el.style.display     = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
