/* =========================================================================
   Paws For A Cause Michigan — Site Interactions
   - Sticky/scrolled navbar
   - Mobile menu open/close
   - GSAP scroll-triggered reveals (with IntersectionObserver fallback)
   - Animated counters
   - Magnetic CTAs
   - Smooth section anchors
   - Form helpers
   - Pointer-glow cards
   ========================================================================= */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* -------------- Page-load overlay fade -------------- */
  const overlay = document.querySelector('[data-page-overlay]');
  if (overlay) {
    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        overlay.classList.add('done');
        setTimeout(() => overlay.remove(), 1400);
      });
    });
    // safety: never let it block forever
    setTimeout(() => { overlay.classList.add('done'); }, 2500);
  }

  /* -------------- Sticky/scrolled nav -------------- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------------- Mobile menu -------------- */
  const burger = document.querySelector('[data-burger]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  if (burger && mobileMenu) {
    const toggle = () => {
      const open = burger.classList.toggle('open');
      mobileMenu.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', toggle);
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  /* -------------- IntersectionObserver fallback for reveals -------------- */
  if (!prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-stagger').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-stagger').forEach(el => el.classList.add('is-in'));
  }

  /* -------------- GSAP-powered enhancements -------------- */
  if (hasScrollTrigger && !prefersReducedMotion) {
    // Hero word-by-word reveal
    document.querySelectorAll('[data-hero-words]').forEach(el => {
      const words = el.querySelectorAll('.word > span');
      gsap.to(words, {
        yPercent: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.06,
        delay: 0.2,
      });
    });

    // Hero subhead + CTAs
    gsap.utils.toArray('[data-hero-up]').forEach((el, i) => {
      gsap.from(el, {
        y: 28,
        opacity: 0,
        duration: 1.1,
        delay: 0.55 + i * 0.12,
        ease: 'power3.out',
      });
    });

    // Parallax for any [data-parallax]
    gsap.utils.toArray('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.parallax) || 0.2;
      gsap.to(el, {
        yPercent: -20 * speed,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    // Section heading fade-up
    gsap.utils.toArray('[data-fade-up]').forEach(el => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    // Stagger groups
    gsap.utils.toArray('[data-stagger]').forEach(group => {
      const items = group.children;
      gsap.from(items, {
        y: 30,
        opacity: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        scrollTrigger: { trigger: group, start: 'top 88%' }
      });
    });
  }

  /* -------------- Animated counters -------------- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const duration = parseFloat(el.dataset.counterDuration || '1.6');
      const suffix = el.dataset.counterSuffix || '';
      const prefix = el.dataset.counterPrefix || '';
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const tick = (now) => {
        const elapsed = (now - start) / 1000;
        const t = Math.min(elapsed / duration, 1);
        const v = target * ease(t);
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(v).toLocaleString() : v.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  /* -------------- Magnetic buttons -------------- */
  if (!prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      const strength = parseFloat(btn.dataset.magnetic || '0.25');
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* -------------- Pointer-glow cards (track mouse for radial gradient) -------------- */
  document.querySelectorAll('.card-glow').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* -------------- Pill-check toggles (volunteer interest pills) -------------- */
  document.querySelectorAll('.pill-check').forEach(p => {
    const input = p.querySelector('input');
    if (!input) return;
    p.classList.toggle('is-checked', input.checked);
    input.addEventListener('change', () => p.classList.toggle('is-checked', input.checked));
  });

  /* -------------- Form submit (demo handler) -------------- */
  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-form-status]');
      const button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = 'Sending...'; }
      setTimeout(() => {
        if (status) status.textContent = 'Thanks! We received your message and will follow up within 48 hours.';
        if (button) { button.disabled = false; button.textContent = 'Sent ✓'; }
        form.reset();
      }, 800);
    });
  });

  /* -------------- Filter pills (state board / events) -------------- */
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const pills = group.querySelectorAll('[data-filter]');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);
    pills.forEach(p => p.addEventListener('click', () => {
      pills.forEach(o => o.classList.remove('is-active'));
      p.classList.add('is-active');
      const f = p.dataset.filter;
      items.forEach(it => {
        const match = f === 'all' || it.dataset.tag === f;
        it.style.display = match ? '' : 'none';
      });
    }));
  });

  /* -------------- Newsletter form -------------- */
  document.querySelectorAll('[data-newsletter]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const button = form.querySelector('button');
      const original = button ? button.textContent : '';
      if (button) { button.textContent = 'Subscribed ✓'; button.disabled = true; }
      form.reset();
      setTimeout(() => { if (button) { button.textContent = original; button.disabled = false; } }, 2400);
    });
  });

  /* -------------- Year stamp -------------- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
