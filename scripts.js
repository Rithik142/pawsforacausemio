window.addEventListener('DOMContentLoaded', () => {
  // ── 1) AUTO‑TRIGGER ALL .reveal ELEMENTS VISIBLE IMMEDIATELY ──
  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.add('visible');
  });

  // ── 2) MOBILE NAV TOGGLE ──
  const burger = document.querySelector('.hamburger');
  const menu   = document.querySelector('nav .nav-list');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      menu.classList.toggle('show');
    });
  }

  // ── 2b) MOBILE DROPDOWN FOR "GET INVOLVED" ──
  document.querySelectorAll('.has-dd > a').forEach(link => {
    link.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        const li = link.parentElement;
        const expanded = li.classList.toggle('open');
        link.setAttribute('aria-expanded', expanded);
      }
    });
  });

  // ── 3) SCROLL‑REVEAL ANIMATIONS ──
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  document.querySelectorAll(
    '.hero-text, .hero-image, .pups h2, .card, .profile-content, .services-section h1, .service-card'
  ).forEach(el => observer.observe(el));

  // ── 4) AJAX CONTACT FORM VIA FORMSPREE ──
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      status.textContent = 'Sending…';
      const data = new FormData(form);
      try {
        const res = await fetch(form.action, {
          method: form.method,
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          status.textContent = '✓ Thanks for your message!';
          form.reset();
        } else {
          const err = await res.json();
          console.error('Formspree error:', err);
          status.textContent = '⚠️ Oops! Please try again.';
        }
      } catch (err) {
        console.error('Network error:', err);
        status.textContent = '⚠️ Network error. Try again later.';
      }
    });
  }

  // ── 5) SMOOTH‑SCROLL WHEN CLICKING PUP CARDS ──
  const headerH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
    10
  ) || 0;
  document.querySelectorAll('.pups .card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const targetEl = document.querySelector(card.getAttribute('href'));
      if (!targetEl) return;
      const top = targetEl.getBoundingClientRect().top
                + window.pageYOffset
                - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── 6) (Removed) AUTO‑SCROLL PUPS CAROUSEL ──
  // We’ve removed the setInterval code so your grids/cards will no longer auto‑scroll.

  // ── 7) SCROLL‑REVEAL FOR EVENTS PAGE ──
  document.querySelectorAll(
    '.events-hero, .events-list h2, .events-list .card, .event-detail'
  ).forEach(el => observer.observe(el));

  // ── 8) SMOOTH‑SCROLL FOR EVENT LINKS ──
  document.querySelectorAll('a[href^="#event-"], .btn-back').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      const top = target.getBoundingClientRect().top
                + window.pageYOffset
                - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
  // ── 9) FIX EMAIL US BUTTON ALIGNMENT + HOVER EFFECT ──
  const emailUsBtn = document.querySelector('.footer-contact-text .btn-submit');
  if (emailUsBtn) {
    emailUsBtn.style.marginTop = '1rem';
    emailUsBtn.style.transition = 'transform 0.2s ease';
    emailUsBtn.addEventListener('mouseenter', () => {
      emailUsBtn.style.transform = 'translateY(-3px)';
    });
    emailUsBtn.addEventListener('mouseleave', () => {
      emailUsBtn.style.transform = 'translateY(0)';
    });
  }
});
