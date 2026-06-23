/* =========================================================================
   PAWS FOR A CAUSE — Donation page interactions
   -------------------------------------------------------------------------
   Builds the monthly tiers + one-time presets from assets/donate-config.js,
   manages an accessible Monthly/One-time selector, keeps a live giving
   summary with the recurring disclosure, validates the custom amount, and
   routes the donor to the correct Stripe Payment Link.

   No payment data is handled here — Stripe's hosted page does all of that.
   The checkout button NEVER routes a monthly selection to a one-time link
   (or vice versa); if the matching link isn't configured the option is
   disabled with a clear message.
   ========================================================================= */
(function () {
  "use strict";

  var CFG = window.PAWS_DONATE;
  if (!CFG) return;

  var SYM = (CFG.org && CFG.org.symbol) || "$";
  var fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: (CFG.org && CFG.org.currency) || "USD",
    maximumFractionDigits: 0
  });
  function money(n) { try { return fmt.format(n); } catch (_) { return SYM + n; } }

  // ---- State ----
  var state = { freq: "monthly", amount: 50, custom: false, customValue: null };

  // ---- Elements ----
  var freqMonthlyBtn = document.getElementById("freq-monthly");
  var freqOneTimeBtn = document.getElementById("freq-onetime");
  var monthlyPanel   = document.getElementById("panel-monthly");
  var oneTimePanel   = document.getElementById("panel-onetime");
  var monthlyGroup   = document.getElementById("monthly-tiers");
  var oneTimeGroup   = document.getElementById("onetime-presets");
  var customWrap     = document.getElementById("custom-wrap");
  var customInput    = document.getElementById("custom-amount");
  var customError    = document.getElementById("custom-error");
  var sumAmount      = document.getElementById("sum-amount");
  var sumFreq        = document.getElementById("sum-freq");
  var sumRenew       = document.getElementById("sum-renew");
  var disclosure     = document.getElementById("recurring-disclosure");
  var checkoutBtn    = document.getElementById("donate-checkout");
  var checkoutNote   = document.getElementById("checkout-note");

  if (!monthlyGroup || !oneTimeGroup || !checkoutBtn) return;

  // ---- Build amount options from config ----
  function makeOption(value, opts) {
    opts = opts || {};
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "amt" + (opts.featured ? " amt--featured" : "") + (opts.custom ? " amt--custom" : "");
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.setAttribute("tabindex", "-1");
    btn.dataset.value = opts.custom ? "custom" : String(value);
    if (opts.custom) {
      btn.innerHTML = '<span class="amt__main">Custom</span>';
    } else if (opts.tier) {
      var annual = value * 12;
      btn.innerHTML =
        (opts.featured ? '<span class="amt__badge">Most Popular</span>' : '') +
        '<span class="amt__price">' + money(value) + '<span class="amt__per">/mo</span></span>' +
        '<span class="amt__annual">' + money(annual) + ' annually</span>' +
        '<span class="amt__name">' + opts.name + '</span>' +
        '<span class="amt__desc">' + opts.desc + '</span>';
    } else {
      var label = opts.plus ? money(value).replace(/\.00$/, "") + "+" : money(value);
      btn.innerHTML = '<span class="amt__main">' + label + '</span>';
    }
    return btn;
  }

  // Monthly tiers
  (CFG.monthlyTiers || []).forEach(function (t) {
    monthlyGroup.appendChild(makeOption(t.amount, { tier: true, name: t.name, desc: t.desc, featured: !!t.featured }));
  });
  monthlyGroup.appendChild(makeOption(null, { custom: true }));

  // One-time presets
  var presets = CFG.oneTimePresets || [];
  presets.forEach(function (v, i) {
    oneTimeGroup.appendChild(makeOption(v, { plus: i === presets.length - 1 }));
  });
  oneTimeGroup.appendChild(makeOption(null, { custom: true }));

  // ---- Selection helpers ----
  function optionsIn(group) {
    return Array.prototype.slice.call(group.querySelectorAll(".amt"));
  }

  function clearGroup(group) {
    optionsIn(group).forEach(function (b) {
      b.classList.remove("is-selected");
      b.setAttribute("aria-checked", "false");
      b.setAttribute("tabindex", "-1");
    });
  }

  function activeGroup() {
    return state.freq === "monthly" ? monthlyGroup : oneTimeGroup;
  }

  function selectOption(btn, focus) {
    var group = activeGroup();
    clearGroup(group);
    btn.classList.add("is-selected");
    btn.setAttribute("aria-checked", "true");
    btn.setAttribute("tabindex", "0");
    if (focus) btn.focus();

    var val = btn.dataset.value;
    if (val === "custom") {
      state.custom = true;
      state.amount = null;
      showCustom(true);
    } else {
      state.custom = false;
      state.amount = parseInt(val, 10);
      showCustom(false);
    }
    update();
  }

  function showCustom(show) {
    if (!customWrap) return;
    customWrap.hidden = !show;
    if (show) {
      // place the custom input right after the active group
      activeGroup().parentNode.insertBefore(customWrap, activeGroup().nextSibling);
      window.setTimeout(function () { if (customInput) customInput.focus(); }, 0);
    } else {
      clearCustomError();
    }
  }

  // ---- Custom amount validation ----
  function clearCustomError() {
    if (!customError) return;
    customError.textContent = "";
    if (customInput) customInput.removeAttribute("aria-invalid");
  }
  function customAmount() {
    if (!customInput) return null;
    var v = parseFloat(customInput.value);
    return isFinite(v) ? Math.round(v * 100) / 100 : null;
  }
  function validateCustom() {
    var v = customAmount();
    var lim = CFG.limits || { min: 1, max: 100000 };
    if (v == null || v <= 0) { setCustomError("Please enter a donation amount."); return false; }
    if (v < lim.min) { setCustomError("The minimum donation is " + money(lim.min) + "."); return false; }
    if (v > lim.max) { setCustomError("Please enter an amount of " + money(lim.max) + " or less, or contact us for larger gifts."); return false; }
    clearCustomError();
    state.customValue = v;
    return true;
  }
  function setCustomError(msg) {
    if (!customError) return;
    customError.textContent = msg;
    if (customInput) customInput.setAttribute("aria-invalid", "true");
  }

  // ---- Resolve the correct Stripe Payment Link (safe by frequency) ----
  function resolveLink() {
    var L = CFG.links || {};
    if (state.freq === "monthly") {
      var m = L.monthly || {};
      if (!state.custom && m[state.amount]) return { url: m[state.amount], exact: true };
      if (m.custom) return { url: m.custom, exact: false };
      return { url: null, reason: "monthly" };
    } else {
      var o = L.oneTime || {};
      if (!state.custom && o.preset && o.preset[state.amount]) return { url: o.preset[state.amount], exact: true };
      if (o.custom) return { url: o.custom, exact: false };
      return { url: null, reason: "onetime" };
    }
  }

  // ---- Live summary + checkout button ----
  function effectiveAmount() {
    if (state.custom) return state.customValue;
    return state.amount;
  }

  function update() {
    var monthly = state.freq === "monthly";
    if (state.custom) validateCustomSilently(); // populate state.customValue before reading it
    var amt = effectiveAmount();

    // summary
    if (sumAmount) sumAmount.textContent = (amt != null) ? money(amt) : (SYM + "—");
    if (sumFreq) sumFreq.textContent = monthly ? "per month" : "one-time";
    if (sumRenew) sumRenew.textContent = monthly
      ? "Renews automatically each month until you cancel."
      : "A single gift — charged once.";
    if (disclosure) disclosure.hidden = !monthly;

    // checkout state
    var resolved = resolveLink();
    var hasAmount = state.custom ? (state.customValue != null) : (amt != null);

    if (!hasAmount) {
      setCheckout(false, "Choose or enter an amount to continue.");
      return;
    }
    if (!resolved.url) {
      if (resolved.reason === "monthly") {
        setCheckout(false, "Monthly giving is being finalized. Please choose a one-time gift or email " + CFG.org.donationEmail + ".");
      } else {
        setCheckout(false, "Online giving is being set up. Please email " + CFG.org.donationEmail + ".");
      }
      return;
    }

    // enabled
    checkoutBtn.href = resolved.url;
    var label = monthly
      ? "Continue — " + money(amt) + "/mo"
      : "Continue — " + money(amt) + " gift";
    checkoutBtn.querySelector(".donate-checkout__label").textContent = label;
    setCheckout(true, resolved.exact
      ? "Opens Stripe's secure checkout in a new tab."
      : "You'll confirm your " + (monthly ? "monthly " : "") + "amount on Stripe's secure page.");
  }

  function validateCustomSilently() {
    var v = customAmount();
    var lim = CFG.limits || { min: 1, max: 100000 };
    var ok = (v != null && v >= lim.min && v <= lim.max);
    state.customValue = ok ? v : null;
    return ok;
  }

  function setCheckout(enabled, note) {
    if (enabled) {
      checkoutBtn.removeAttribute("aria-disabled");
      checkoutBtn.classList.remove("is-disabled");
    } else {
      checkoutBtn.setAttribute("aria-disabled", "true");
      checkoutBtn.classList.add("is-disabled");
      checkoutBtn.removeAttribute("href");
      var lbl = checkoutBtn.querySelector(".donate-checkout__label");
      if (lbl) lbl.textContent = "Continue to secure checkout";
    }
    if (checkoutNote) checkoutNote.textContent = note || "";
  }

  // ---- Frequency toggle ----
  function setFrequency(freq, focus) {
    state.freq = freq;
    var monthly = freq === "monthly";

    freqMonthlyBtn.setAttribute("aria-selected", monthly ? "true" : "false");
    freqOneTimeBtn.setAttribute("aria-selected", monthly ? "false" : "true");
    freqMonthlyBtn.tabIndex = monthly ? 0 : -1;
    freqOneTimeBtn.tabIndex = monthly ? -1 : 0;
    monthlyPanel.hidden = !monthly;
    oneTimePanel.hidden = monthly;
    if (focus) (monthly ? freqMonthlyBtn : freqOneTimeBtn).focus();

    // default selection per panel
    var group = activeGroup();
    var current = group.querySelector(".amt.is-selected");
    if (!current) {
      // pick featured (monthly) or a sensible default (one-time $50)
      var preferred = group.querySelector(".amt--featured")
        || group.querySelector('.amt[data-value="50"]')
        || group.querySelector(".amt");
      if (preferred) selectOption(preferred, false);
    } else {
      // re-sync state from existing selection
      selectOption(current, false);
    }
    update();
  }

  // ---- Wire events ----
  freqMonthlyBtn.addEventListener("click", function () { setFrequency("monthly", false); });
  freqOneTimeBtn.addEventListener("click", function () { setFrequency("onetime", false); });
  // Arrow keys on the frequency tablist
  [freqMonthlyBtn, freqOneTimeBtn].forEach(function (tab) {
    tab.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFrequency(state.freq === "monthly" ? "onetime" : "monthly", true);
      }
    });
  });

  function wireGroup(group) {
    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".amt");
      if (btn) selectOption(btn, false);
    });
    group.addEventListener("keydown", function (e) {
      var items = optionsIn(group);
      var idx = items.indexOf(document.activeElement);
      if (idx === -1) return;
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = items[(idx + 1) % items.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = items[(idx - 1 + items.length) % items.length];
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); selectOption(items[idx], false); return; }
      if (next) { e.preventDefault(); selectOption(next, true); }
    });
  }
  wireGroup(monthlyGroup);
  wireGroup(oneTimeGroup);

  if (customInput) {
    customInput.addEventListener("input", function () { clearCustomError(); update(); });
    customInput.addEventListener("blur", function () { if (state.custom) validateCustom(); });
  }

  // Guard the checkout button when disabled or (for custom) invalid
  checkoutBtn.addEventListener("click", function (e) {
    if (checkoutBtn.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }
    if (state.custom && !validateCustom()) { e.preventDefault(); if (customInput) customInput.focus(); return; }
  });

  // Hero CTA shortcuts (Donate Monthly / One-time)
  document.querySelectorAll("[data-set-freq]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      var f = el.getAttribute("data-set-freq");
      setFrequency(f, false);
    });
  });

  // ---- Init ----
  setFrequency("monthly", false);

  // Stamp configurable legal/contact text where present
  document.querySelectorAll("[data-cfg-tax]").forEach(function (el) { el.textContent = CFG.taxLine; });
  document.querySelectorAll("[data-cfg-ein]").forEach(function (el) { el.textContent = CFG.org.ein; });
  document.querySelectorAll("[data-cfg-legalname]").forEach(function (el) { el.textContent = CFG.org.legalName; });
  document.querySelectorAll("[data-cfg-email]").forEach(function (el) {
    el.textContent = CFG.org.donationEmail;
    if (el.tagName === "A") el.href = "mailto:" + CFG.org.donationEmail;
  });
  if (CFG.managePortalUrl) {
    document.querySelectorAll("[data-cfg-portal]").forEach(function (el) {
      el.href = CFG.managePortalUrl;
      el.hidden = false;
    });
  }
})();
