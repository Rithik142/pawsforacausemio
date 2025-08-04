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
  document.querySelectorAll('.has‑dd > a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const li = e.currentTarget.parentElement;
      const isOpen = li.classList.toggle('open');
      link.setAttribute('aria‑expanded', isOpen);
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

  // ── 10) EVENTS FILTER DROPDOWN LOGIC ──
  const filterSelect = document.getElementById('event-filter');
  if (filterSelect) {
    const updateEvents = () => {
      const val = filterSelect.value;
      document.querySelectorAll('#events .events-list').forEach(list => {
        list.hidden = (list.id !== val);
      });
    };
    filterSelect.addEventListener('change', updateEvents);
    updateEvents();
  }

  // ── 11) COUNTER-UP ANIMATION FOR STATS ──
  const counters = document.querySelectorAll('.countup-number[data-target]');
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-target'), 10) || 0;
    const duration = 1400; // ms
    let start = 0;
    if (target === 0) {
      el.textContent = '0';
      return;
    }
    const step = (timestamp, startTime) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) {
        requestAnimationFrame(ts => step(ts, startTime));
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(ts => step(ts));
  };

  // Only animate when the number enters the viewport
  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObs.observe(el));
  } else {
    // Fallback: animate all immediately
    counters.forEach(animateCounter);
  }
});

// Newsletter form submission (AJAX)
const subscribeForm = document.getElementById('subscribeForm');
const subscribeStatus = document.getElementById('subscribeStatus');

if (subscribeForm && subscribeStatus) {
  subscribeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    subscribeStatus.textContent = 'Subscribing...';

    const formData = new FormData(subscribeForm);
    try {
      const res = await fetch(subscribeForm.action, {
        method: 'POST',
        headers: {
          'Accept': 'application/json'
        },
        body: formData
      });

      if (res.ok) {
        subscribeStatus.textContent = '✅ Thanks for subscribing!';
        subscribeForm.reset();
      } else {
        subscribeStatus.textContent = '⚠️ There was an issue. Please try again.';
      }
    } catch (err) {
      console.error(err);
      subscribeStatus.textContent = '⚠️ Network error. Please try again later.';
    }
  });
}
