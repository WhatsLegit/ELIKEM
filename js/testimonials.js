// Testimonials Module — live real-time updates via onSnapshot
import { db, collections } from './firebase.js';
import {
  collection, addDoc, onSnapshot, orderBy, query
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ── Cloudinary config ──
const CLOUDINARY_CLOUD_NAME = 'dfajt5l0p';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

async function uploadPhotoToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'elikemdots/testimonials');
  const res = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Photo upload failed');
  const data = await res.json();
  return data.secure_url;
}

// ── Live listener — updates the UI whenever Firestore changes ──
export function loadTestimonials() {
  const container = document.getElementById('testimonialsContainer')
    || document.querySelector('.testimonial-grid');
  if (!container) return;

  // Show spinner while waiting for first snapshot
  container.innerHTML = `
    <div style="text-align:center;padding:2rem;grid-column:1/-1;">
      <div class="loading"></div>
    </div>`;

  const q = query(
    collection(db, collections.testimonials),
    orderBy('createdAt', 'desc')
  );

  onSnapshot(q, (snap) => {
    const testimonials = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTestimonials(container, testimonials);
  }, (err) => {
    console.error('Testimonials error:', err);
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:2rem;grid-column:1/-1;">Could not load reviews.</p>';
  });
}

function renderTestimonials(container, testimonials) {
  if (testimonials.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:2rem;grid-column:1/-1;">No reviews yet. Be the first to share your experience!</p>';
    return;
  }

  container.innerHTML = testimonials.map(t => {
    const rating = parseInt(t.rating) || 5;
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill="${i < rating ? '#F59E0B' : 'none'}"
        stroke="${i < rating ? '#D97706' : '#D1D5DB'}"
        stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
        style="display:inline-block;">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>`
    ).join('');

    // Avatar: photo or initial letter
    const avatar = t.photo
      ? `<img src="${t.photo}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="${t.name}">`
      : `<div style="width:42px;height:42px;border-radius:50%;
              background:linear-gradient(135deg,#2563EB,#0891b2);
              display:flex;align-items:center;justify-content:center;
              font-weight:700;font-size:1rem;color:#fff;flex-shrink:0;">
           ${(t.name || '?')[0].toUpperCase()}
         </div>`;

    return `
      <div class="testimonial glass glass-hover">
        <div style="margin-bottom:0.8rem;display:flex;gap:2px;">${stars}</div>
        <p style="color:#333;line-height:1.75;font-size:0.95rem;">"${t.message}"</p>
        <div style="margin-top:1.2rem;display:flex;align-items:center;gap:0.8rem;
                    border-top:1px solid rgba(0,0,0,0.06);padding-top:1rem;">
          ${avatar}
          <div>
            <div style="font-weight:600;color:#111;font-size:0.92rem;">${t.name}</div>
            <div style="font-size:0.78rem;color:#aaa;margin-top:1px;">
              ${t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ── Submit a new testimonial ──
export async function submitTestimonial(name, message, rating, photoFile = null) {
  let photoUrl = '';
  if (photoFile && photoFile.size > 0) {
    photoUrl = await uploadPhotoToCloudinary(photoFile);
  }
  await addDoc(collection(db, collections.testimonials), {
    name,
    message,
    rating: parseInt(rating),
    photo: photoUrl,
    createdAt: new Date().toISOString()
  });
  // No need to call loadTestimonials() — onSnapshot fires automatically
}
