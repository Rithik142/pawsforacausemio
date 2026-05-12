/* =========================================================================
   Paws For A Cause Michigan, site interactions.
   Keep it small: nav state, mobile menu, reveal-on-scroll,
   year stamp, form feedback. No counters. No marketing animations.
   ========================================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nav scroll state ---------- */
  var navShell = document.querySelector('.nav-shell');
  if (navShell) {
    var onScroll = function () {
      navShell.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('[data-burger]');
  var menu = document.querySelector('[data-mobile-menu]');
  if (burger && menu) {
    var closeMenu = function () {
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    var openMenu = function () {
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    burger.setAttribute('aria-controls', 'mobile-menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      if (burger.classList.contains('is-open')) closeMenu(); else openMenu();
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------- Reveal-on-scroll ---------- */
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal, .reveal-up, .reveal-fade, .reveal-stagger, .reveal-clip').forEach(function (el) { io.observe(el); });
    document.querySelectorAll('[data-stagger]').forEach(function (g) {
      g.classList.add('reveal-stagger');
      io.observe(g);
    });
    document.querySelectorAll('.reveal-stagger').forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });
  } else {
    document.querySelectorAll('.reveal, .reveal-up, .reveal-fade, .reveal-stagger, .reveal-clip, [data-stagger]').forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  /* ---------- Pill toggle visual state ---------- */
  document.querySelectorAll('.pill-check').forEach(function (p) {
    var input = p.querySelector('input');
    if (!input) return;
    p.classList.toggle('is-checked', input.checked);
    input.addEventListener('change', function () { p.classList.toggle('is-checked', input.checked); });
  });

  /* ---------- Event filter ---------- */
  document.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var buttons = group.querySelectorAll('[data-filter]');
    var sel = group.dataset.filterGroup;
    var items = document.querySelectorAll(sel);
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        buttons.forEach(function (o) { o.classList.remove('is-active'); o.classList.remove('is-checked'); });
        b.classList.add('is-active');
        b.classList.add('is-checked');
        var f = b.dataset.filter;
        items.forEach(function (it) {
          var match = f === 'all' || it.dataset.tag === f || (it.dataset.tags || '').split(' ').indexOf(f) >= 0;
          it.style.display = match ? '' : 'none';
        });
      });
    });
  });

  /* ---------- Form submit feedback (no real backend wired) ---------- */
  document.querySelectorAll('[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      // If the form has a real action (e.g. Formspree), let it submit normally.
      if (form.getAttribute('action')) return;
      e.preventDefault();
      var status = form.querySelector('[data-form-status]');
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      if (status) status.textContent = 'Thanks. We received your message and will get back to you within 2–3 school or business days.';
      form.reset();
      setTimeout(function () { if (btn) btn.disabled = false; }, 1800);
    });
  });

  /* ---------- Year stamp ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
