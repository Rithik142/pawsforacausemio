window.addEventListener('DOMContentLoaded', () => {
  // ── 1) AUTO‑TRIGGER ALL .reveal ELEMENTS VISIBLE IMMEDIATELY ──
  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.add('visible');
  });

  // ── 2) MOBILE NAV TOGGLE ──
  const burger = document.querySelector('.hamburger');
  const menu   = document.querySelector('nav .nav-list');
  burger.addEventListener('click', () => {
    menu.classList.toggle('show');
  });

  // ── 3) SCROLL‑REVEAL ANIMATIONS ──
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll(
    '.hero-text, .hero-image, .pups h2, .card, .profile-content'
  ).forEach(el => observer.observe(el));

  // ── 4) AJAX CONTACT FORM VIA FORMSPREE ──
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', async (e) => {
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
    getComputedStyle(document.documentElement)
      .getPropertyValue('--header-height'),
    10
  ) || 0;
  document.querySelectorAll('.pups .card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const targetId = card.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      const top = targetEl.getBoundingClientRect().top
                + window.pageYOffset
                - headerH;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ── 6) AUTO‑SCROLL PUPS CAROUSEL ──
  const carousel = document.querySelector('.pups .card-grid');
  if (carousel) {
    const speed = 1;    // px per tick
    const delay = 20;   // ms per tick
    let scrollInterval;

    const startAutoScroll = () => {
      scrollInterval = setInterval(() => {
        carousel.scrollLeft += speed;
        // loop back to start when we hit the end
        if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth) {
          carousel.scrollLeft = 0;
        }
      }, delay);
    };

    const stopAutoScroll = () => {
      clearInterval(scrollInterval);
    };

    // pause auto‑scroll on hover
    carousel.addEventListener('mouseenter', stopAutoScroll);
    carousel.addEventListener('mouseleave', startAutoScroll);

    // start it up
    startAutoScroll();
  }

}); // end DOMContentLoaded
