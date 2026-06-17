/* ===========================================================================
   PAWS FOR A CAUSE — site-wide interactions.
   Keep small and dependency-free: nav, mobile menu, dropdowns, reveals,
   forms (Formspree), year stamping, smooth scroll, reduced-motion handling.
   =========================================================================== */
(function () {
  'use strict';

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    /* ----- 1. Year stamp ----- */
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });

    /* ----- 2. Auto-reveal anything already in view; observe the rest ----- */
    var revealEls = document.querySelectorAll('.reveal, .ip-reveal');
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('visible');
        } else {
          io.observe(el);
        }
      });
    }

    /* ----- 2b. Numbered process: progress line + active step ----- */
    (function () {
      var steps = document.querySelector('.ip-steps');
      if (!steps) return;
      var fill = steps.querySelector('.ip-steps__fill');
      var items = Array.prototype.slice.call(steps.querySelectorAll('.ip-step'));
      if (!items.length) return;
      if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        items.forEach(function (s) { s.classList.add('is-active'); });
        if (fill) fill.style.height = '100%';
        return;
      }
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('is-active');
        });
        var activeCount = steps.querySelectorAll('.ip-step.is-active').length;
        if (fill) fill.style.height = Math.round((activeCount / items.length) * 100) + '%';
      }, { rootMargin: '0px 0px -45% 0px', threshold: 0.1 });
      items.forEach(function (s) { sio.observe(s); });
    })();

    /* ----- 3. Mobile nav toggle + accessibility ----- */
    var burger = document.querySelector('.hamburger');
    var menu = document.querySelector('nav .nav-list');
    if (burger && menu) {
      // promote burger to a real button-like control
      if (!burger.hasAttribute('role')) burger.setAttribute('role', 'button');
      if (!burger.hasAttribute('tabindex')) burger.setAttribute('tabindex', '0');
      burger.setAttribute('aria-controls', 'primary-nav');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Toggle navigation');
      if (!menu.id) menu.id = 'primary-nav';

      function setMenuOpen(open) {
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
        menu.classList.toggle('show', open);
        document.body.classList.toggle('nav-open', open);
        if (!open) {
          // close any open dropdowns when menu closes
          document.querySelectorAll('.has-dd.open').forEach(function (li) {
            li.classList.remove('open');
            var trigger = li.querySelector(':scope > a');
            if (trigger) trigger.setAttribute('aria-expanded', 'false');
          });
        }
      }

      burger.addEventListener('click', function () {
        setMenuOpen(!menu.classList.contains('show'));
      });
      burger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setMenuOpen(!menu.classList.contains('show'));
        }
      });

      // close menu on Escape
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('show')) {
          setMenuOpen(false);
          burger.focus();
        }
      });

      // close menu when clicking outside
      document.addEventListener('click', function (e) {
        if (!menu.classList.contains('show')) return;
        var inside = menu.contains(e.target) || burger.contains(e.target);
        if (!inside) setMenuOpen(false);
      });

      // close menu when a nav link is followed
      menu.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          // allow dropdown-trigger clicks to open dropdown on mobile (handled below)
          if (a.closest('.has-dd') && a.parentElement.classList.contains('has-dd')) {
            return;
          }
          setMenuOpen(false);
        });
      });
    }

    /* ----- 4. Dropdown ("Get Involved") — works on touch + keyboard ----- */
    document.querySelectorAll('.has-dd').forEach(function (li) {
      var trigger = li.querySelector(':scope > a');
      var dropdown = li.querySelector(':scope > .dropdown');
      if (!trigger || !dropdown) return;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-haspopup', 'true');

      function closeOthers() {
        document.querySelectorAll('.has-dd.open').forEach(function (other) {
          if (other !== li) {
            other.classList.remove('open');
            var t = other.querySelector(':scope > a');
            if (t) t.setAttribute('aria-expanded', 'false');
          }
        });
      }

      // On small screens trigger toggles dropdown (and prevents nav)
      trigger.addEventListener('click', function (e) {
        var isMobile = window.matchMedia('(max-width: 900px)').matches;
        if (!isMobile) return; // desktop uses :hover/:focus-within
        e.preventDefault();
        closeOthers();
        var nowOpen = li.classList.toggle('open');
        trigger.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
      });

      // Keyboard support: open on Enter/Space
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          closeOthers();
          var nowOpen = li.classList.toggle('open');
          trigger.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
          if (nowOpen) {
            var first = dropdown.querySelector('a');
            if (first) first.focus();
          }
        } else if (e.key === 'Escape') {
          li.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      // Keep aria-expanded in sync with desktop :hover/:focus-within state
      li.addEventListener('mouseenter', function () {
        trigger.setAttribute('aria-expanded', 'true');
      });
      li.addEventListener('mouseleave', function () {
        if (!li.classList.contains('open')) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      });

      // close dropdown if focus leaves
      li.addEventListener('focusout', function (e) {
        if (!li.contains(e.relatedTarget)) {
          li.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }
      });
    });

    /* ----- 5. Smooth anchor scrolling that respects sticky header ----- */
    var headerH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      10
    );
    if (!Number.isFinite(headerH)) headerH = 80;

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 8;
        window.scrollTo({
          top: top,
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
        // move focus for screen readers
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      });
    });

    /* ----- 6. Contact form (Formspree, optional) ----- */
    var contactForm = document.getElementById('contactForm');
    var contactStatus = document.getElementById('formStatus');
    if (contactForm && contactStatus) {
      contactForm.addEventListener('submit', function (e) {
        if (!contactForm.action) return; // browser default
        e.preventDefault();
        contactStatus.textContent = 'Sending…';
        var btn = contactForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var data = new FormData(contactForm);
        fetch(contactForm.action, {
          method: contactForm.method || 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        }).then(function (res) {
          if (res.ok) {
            contactStatus.textContent = '✓ Thanks for your message — we will be in touch.';
            contactForm.reset();
          } else {
            contactStatus.textContent = '⚠️ Something went wrong. Please email us directly.';
          }
        }).catch(function () {
          contactStatus.textContent = '⚠️ Network error. Please email us at pawsforacausemi@gmail.com.';
        }).finally(function () {
          if (btn) btn.disabled = false;
        });
      });
    }

    /* ----- 7. Newsletter form ----- */
    var subForm = document.getElementById('subscribeForm');
    var subStatus = document.getElementById('subscribeStatus');
    if (subForm && subStatus) {
      subForm.addEventListener('submit', function (e) {
        if (!subForm.action) return;
        e.preventDefault();
        subStatus.textContent = 'Subscribing…';
        var btn = subForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var data = new FormData(subForm);
        fetch(subForm.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        }).then(function (res) {
          if (res.ok) {
            subStatus.textContent = '✓ Thanks for subscribing.';
            subForm.reset();
          } else {
            subStatus.textContent = '⚠️ Could not subscribe. Please try again later.';
          }
        }).catch(function () {
          subStatus.textContent = '⚠️ Network error. Please try again later.';
        }).finally(function () {
          if (btn) btn.disabled = false;
        });
      });
    }

    /* ----- 8. Partner & volunteer forms handle their own submit inline
       (see partner.html / volunteer.html) to avoid double submission. ----- */

    /* ----- 9. Mark active nav link based on current pathname ----- */
    try {
      var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      document.querySelectorAll('.nav-list a[href]').forEach(function (a) {
        var hrefFile = (a.getAttribute('href') || '').split('/').pop().toLowerCase();
        if (hrefFile === here) {
          a.classList.add('active');
          a.setAttribute('aria-current', 'page');
        }
      });
    } catch (e) { /* ignore */ }

    /* ----- 10. Events filter dropdown (legacy) ----- */
    var filterSelect = document.getElementById('event-filter');
    if (filterSelect) {
      var updateEvents = function () {
        var val = filterSelect.value;
        document.querySelectorAll('#events .events-list').forEach(function (list) {
          list.hidden = (list.id !== val);
        });
      };
      filterSelect.addEventListener('change', updateEvents);
      updateEvents();
    }

    /* ----- 11. Header Donate button -> Stripe Buy Button checkout -----
       Keeps the existing green .btn-donate styling untouched. We render the
       Stripe Buy Button off-screen and forward header-Donate clicks to it,
       so no second visible Donate button is added.
       The link's href="donate.html" remains as a no-JS fallback. */
    (function () {
      var STRIPE_SCRIPT    = 'https://js.stripe.com/v3/buy-button.js';
      var BUY_BUTTON_ID    = 'buy_btn_1TjBoBHGigJMOJurs1bB6aFa';
      var PUBLISHABLE_KEY  = 'pk_live_51TemnKHGigJMOJurxptUHAvjoFCFsPcCuPBd0204xYUlYyQ9wivEfAJgdKPfUKF8racqvHavoJSmMrTSplu5oqVY00ibHoESz8';
      var HIDDEN_ID        = 'pfac-stripe-buy';

      // Load Stripe Buy Button script exactly once per page.
      function loadStripeScript() {
        if (document.querySelector('script[data-pfac-stripe]')) return;
        var s = document.createElement('script');
        s.async = true;
        s.src = STRIPE_SCRIPT;
        s.setAttribute('data-pfac-stripe', '1');
        document.head.appendChild(s);
      }

      // Render the Stripe Buy Button element once, off-screen but interactive.
      function ensureBuyButton() {
        var wrap = document.getElementById(HIDDEN_ID);
        if (wrap) return wrap;
        wrap = document.createElement('div');
        wrap.id = HIDDEN_ID;
        // Off-screen but rendered, so clicks can be programmatically forwarded.
        wrap.style.cssText = [
          'position:absolute',
          'left:-10000px',
          'top:0',
          'width:1px',
          'height:1px',
          'overflow:hidden',
          'opacity:0',
          'pointer-events:none'
        ].join(';');
        wrap.setAttribute('aria-hidden', 'true');
        var sbb = document.createElement('stripe-buy-button');
        sbb.setAttribute('buy-button-id', BUY_BUTTON_ID);
        sbb.setAttribute('publishable-key', PUBLISHABLE_KEY);
        wrap.appendChild(sbb);
        document.body.appendChild(wrap);
        return wrap;
      }

      // Forward a header-Donate click to the Stripe element while still
      // inside the user-gesture context so window.open isn't blocked.
      function triggerCheckout() {
        var wrap = ensureBuyButton();
        var sbb = wrap.querySelector('stripe-buy-button');
        if (!sbb) return false;
        // Stripe's element listens on the host; try host click first.
        try { sbb.click(); } catch (_) {}
        // Also dispatch into shadow DOM if available (defensive).
        try {
          if (sbb.shadowRoot) {
            var inner = sbb.shadowRoot.querySelector('button, a, [role="button"]');
            if (inner) inner.click();
          }
        } catch (_) {}
        return true;
      }

      loadStripeScript();
      ensureBuyButton();

      // Wire every header Donate button (the only .btn-donate on each page).
      var donateBtns = document.querySelectorAll('.btn-donate');
      donateBtns.forEach(function (el) {
        el.addEventListener('click', function (e) {
          // Respect intent to open in new tab / new window.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
          // Prevent navigation to donate.html — open Stripe instead.
          e.preventDefault();
          triggerCheckout();
        });
      });
    })();
  });
})();
