// UI Interactions & Animations

// ── Mobile Video Autoplay Fix ──
(function fixMobileVideoAutoplay() {
  const video = document.querySelector('.video-bg-wrapper video');
  if (!video) return;

  // Ensure attributes for mobile
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  function attemptPlay() {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked - show fallback background
        document.body.style.background = 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 50%, #f8fafc 100%)';
      });
    }
  }

  // Try playing immediately
  attemptPlay();

  // Try again after user interaction (mobile requirement)
  document.addEventListener('touchstart', attemptPlay, { once: true });
  document.addEventListener('click', attemptPlay, { once: true });

  // Disable video switching on mobile (can cause issues)
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    video.removeAttribute('loop');
    video.loop = true; // Simple loop is more reliable
  }
})();

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── Navbar scroll effect ──
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    if (scrolled > 60) {
      navbar.style.background = 'rgba(255,255,255,0.97)';
      navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
    } else {
      navbar.style.background = 'rgba(255,255,255,0.9)';
      navbar.style.boxShadow = 'none';
    }
  }
});

// ── Intersection Observer for scroll-in animations ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.animate').forEach(el => {
  observer.observe(el);
});

// ── Loading helpers ──
export function showLoading(btn, text = 'Processing...') {
  btn.dataset.originalText = btn.innerHTML;
  btn.innerHTML = `<span class="loading" style="width:16px;height:16px;border-width:2px;vertical-align:middle;margin-right:8px;"></span>${text}`;
  btn.disabled = true;
}

export function hideLoading(btn) {
  btn.innerHTML = btn.dataset.originalText || 'Submit';
  btn.disabled = false;
}

// ── Video background: switch between the two videos for variety ──
// DISABLED on mobile - causes playback issues
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const videoBg = document.querySelector('.video-bg-wrapper video');
if (videoBg && !isMobile) {
  videoBg.addEventListener('ended', () => {
    // Swap sources to alternate between the two videos
    const sources = videoBg.querySelectorAll('source');
    if (sources.length >= 2) {
      const first = sources[0].src;
      sources[0].src = sources[1].src;
      sources[1].src = first;
      videoBg.load();
      videoBg.play();
    }
  });
}

// ── Hero video: same alternating logic ──
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  heroVideo.addEventListener('ended', () => {
    const sources = heroVideo.querySelectorAll('source');
    if (sources.length >= 2) {
      const first = sources[0].src;
      sources[0].src = sources[1].src;
      sources[1].src = first;
      heroVideo.load();
      heroVideo.play();
    }
  });
}

// ── Mobile nav drawer (right-side panel) ──
document.addEventListener('DOMContentLoaded', () => {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileNav    = document.getElementById('mobileNav');
  const mobileClose  = document.getElementById('mobileNavClose');

  if (!hamburgerBtn || !mobileNav) return;

  // Create backdrop element
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  document.body.appendChild(backdrop);

  function openNav() {
    hamburgerBtn.classList.add('open');
    mobileNav.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    hamburgerBtn.classList.remove('open');
    mobileNav.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  hamburgerBtn.addEventListener('click', () => {
    mobileNav.classList.contains('open') ? closeNav() : openNav();
  });

  if (mobileClose) mobileClose.addEventListener('click', closeNav);
  backdrop.addEventListener('click', closeNav);

  // Close when a nav link is tapped
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });
});

// ── Mobile navbar: cart badge + user avatar ──
document.addEventListener('DOMContentLoaded', () => {

  // ── Cart badge — reads localStorage cart count ──
  function updateNavCartBadge() {
    const badge = document.getElementById('navCartBadge');
    if (!badge) return;
    try {
      const cart  = JSON.parse(localStorage.getItem('cart')) || [];
      const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
      badge.textContent = count > 99 ? '99+' : count;
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch { badge.classList.add('hidden'); }
  }

  updateNavCartBadge();

  // Re-check whenever localStorage changes (e.g. item added from another tab)
  window.addEventListener('storage', updateNavCartBadge);

  // Also re-check every 2 seconds in case cart was updated on same page
  setInterval(updateNavCartBadge, 2000);
});

// ── Mobile avatar — updated by auth.js when user logs in ──
// Called from auth.js updateNavAuthState
window._updateMobileAvatar = function(initial, isLoggedIn) {
  const avatarBtn = document.getElementById('navAvatarBtn');
  if (!avatarBtn) return;
  if (isLoggedIn && initial) {
    avatarBtn.textContent    = initial.toUpperCase();
    avatarBtn.style.display  = 'flex';
  } else {
    avatarBtn.style.display  = 'none';
  }
};
