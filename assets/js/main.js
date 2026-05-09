/* =========================================================================
   Paws For A Cause Michigan — v2 Interactions
   Purposeful motion only. No magnetic gimmicks. Custom strong easing curves
   are in CSS. JS handles state + reveals + counters + nav + forms + filters.
   ========================================================================= */
(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- 1. Page curtain (open after first paint) ----- */
  const curtain = document.querySelector('[data-curtain]');
  if (curtain) {
    const open = () => curtain.classList.add('is-done');
    if (document.readyState === 'complete') {
      requestAnimationFrame(() => setTimeout(open, 220));
    } else {
      window.addEventListener('load', () => setTimeout(open, 220), { once: true });
    }
    setTimeout(() => { curtain.classList.add('is-done'); }, 2200);
    curtain.addEventListener('transitionend', () => {
      if (curtain.classList.contains('is-done')) curtain.remove();
    });
  }

  /* Legacy data-page-overlay (older pages): fade and remove */
  const legacyOverlay = document.querySelector('[data-page-overlay]');
  if (legacyOverlay) {
    const finish = () => { legacyOverlay.classList.add('done'); setTimeout(() => legacyOverlay.remove(), 900); };
    if (document.readyState === 'complete') setTimeout(finish, 220);
    else window.addEventListener('load', () => setTimeout(finish, 220), { once: true });
    setTimeout(finish, 2200);
  }

  /* ----- 2. Nav scrolled state ----- */
  const nav = document.querySelector('[data-nav]');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ----- 3. Mobile menu ----- */
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (burger && menu) {
    const toggle = () => {
      const open = burger.classList.toggle('is-open');
      menu.classList.toggle('is-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    burger.addEventListener('click', toggle);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('is-open');
      menu.classList.remove('is-open');
      document.body.style.overflow = '';
    }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) toggle();
    });
  }

  /* ----- 4. Scroll-triggered reveals (IntersectionObserver) ----- */
  if (!reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    document.querySelectorAll('.reveal, .reveal-up, .reveal-fade, .reveal-stagger, .reveal-clip, [data-fade-up]').forEach(el => io.observe(el));

    // Legacy [data-stagger] containers behave like .reveal-stagger
    document.querySelectorAll('[data-stagger]').forEach(group => {
      group.classList.add('reveal-stagger');
      io.observe(group);
    });

    // Set CSS index variable for stagger groups (children animate in sequence)
    document.querySelectorAll('.reveal-stagger').forEach(group => {
      Array.from(group.children).forEach((child, i) => child.style.setProperty('--i', i));
    });
  } else {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-fade, .reveal-stagger, .reveal-clip, [data-fade-up], [data-stagger]').forEach(el => el.classList.add('is-in'));
  }

  /* ----- 5. Hero word reveal (CSS-driven, JS triggers timing) ----- */
  document.querySelectorAll('[data-hero-words] .word > span').forEach((span, i) => {
    span.style.transition = `transform 900ms cubic-bezier(0.23, 1, 0.32, 1) ${100 + i * 70}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      span.style.transform = 'translateY(0)';
    }));
  });

  /* ----- 6. Hero supporting elements fade in ----- */
  document.querySelectorAll('[data-hero-up]').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = `opacity 800ms cubic-bezier(0.23, 1, 0.32, 1) ${320 + i * 90}ms, transform 800ms cubic-bezier(0.23, 1, 0.32, 1) ${320 + i * 90}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }));
  });

  /* ----- 7. Animated counters (intersection-triggered) ----- */
  const counters = document.querySelectorAll('[data-counter]');
  if (counters.length) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.counter);
      const duration = parseFloat(el.dataset.counterDuration || '1.6');
      const suffix = el.dataset.counterSuffix || '';
      const prefix = el.dataset.counterPrefix || '';
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 4); // quart ease-out
      const step = (now) => {
        const t = Math.min((now - start) / 1000 / duration, 1);
        const v = target * ease(t);
        el.textContent = prefix + (Number.isInteger(target) ? Math.round(v).toLocaleString() : v.toFixed(1)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  /* ----- 8. Pill-check toggle state (volunteer interests, donation use) ----- */
  document.querySelectorAll('.pill-check').forEach(p => {
    const input = p.querySelector('input');
    if (!input) {
      // Filter buttons (no input). Active state controlled by data-filter-group below.
      return;
    }
    p.classList.toggle('is-checked', input.checked);
    input.addEventListener('change', () => p.classList.toggle('is-checked', input.checked));
  });

  /* ----- 9. Filter groups (events, state board) ----- */
  document.querySelectorAll('[data-filter-group]').forEach(group => {
    const buttons = group.querySelectorAll('[data-filter]');
    const targetSelector = group.dataset.filterGroup;
    const items = document.querySelectorAll(targetSelector);
    buttons.forEach(b => b.addEventListener('click', () => {
      buttons.forEach(o => { o.classList.remove('is-active'); o.classList.remove('is-checked'); });
      b.classList.add('is-active');
      b.classList.add('is-checked');
      const f = b.dataset.filter;
      items.forEach(it => {
        const match = f === 'all' || it.dataset.tag === f || (it.dataset.tags || '').split(' ').includes(f);
        it.style.display = match ? '' : 'none';
      });
    }));
  });

  /* ----- 10. Forms (demo handler) ----- */
  document.querySelectorAll('[data-form]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.querySelector('[data-form-status]');
      const button = form.querySelector('button[type="submit"]');
      const labelEl = button ? button.querySelector('.btn__label') || button : null;
      const original = labelEl ? labelEl.textContent : '';
      if (button) { button.disabled = true; if (labelEl) labelEl.textContent = 'Sending'; }
      setTimeout(() => {
        if (status) status.textContent = 'Thanks. We received your message and will follow up within 48 hours.';
        if (button) { button.disabled = false; if (labelEl) labelEl.textContent = 'Sent'; }
        form.reset();
        document.querySelectorAll('.pill-check').forEach(p => {
          const i = p.querySelector('input');
          if (i) p.classList.toggle('is-checked', i.checked);
        });
        setTimeout(() => { if (labelEl) labelEl.textContent = original; }, 2400);
      }, 700);
    });
  });

  /* ----- 11. Newsletter inline form ----- */
  document.querySelectorAll('[data-newsletter]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const button = form.querySelector('button');
      const original = button ? button.textContent : '';
      if (button) { button.textContent = 'Subscribed'; button.disabled = true; }
      form.reset();
      setTimeout(() => { if (button) { button.textContent = original; button.disabled = false; } }, 2400);
    });
  });

  /* ----- 12. Year stamp ----- */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ----- 13. Tilt on hero photo (CSS-driven, listens to mouse) ----- */
  if (!reduced) {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      const max = 4; // degrees
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.style.transform = `rotate(${(-1.5 + (x - 0.5) * max).toFixed(2)}deg) rotateX(${((0.5 - y) * max * 0.7).toFixed(2)}deg) rotateY(${((x - 0.5) * max).toFixed(2)}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }
})();
