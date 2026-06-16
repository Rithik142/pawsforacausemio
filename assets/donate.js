/* =========================================================================
   PAWS FOR A CAUSE — Donate page interactions + provider config layer
   -------------------------------------------------------------------------
   ONLINE GIVING IS NOT LIVE. No payment provider/keys/card collection exist.
   To enable real donations later, set BOTH fields below to the org's PUBLIC
   hosted donation page (Donorbox / Givebutter / Stripe Payment Link, etc.):

       DONATION_CONFIG.provider = "donorbox";   // or "givebutter" | "stripe" | "other"
       DONATION_CONFIG.url      = "https://YOUR-REAL-HOSTED-DONATION-URL";

   When a url is set, the Donate button opens that hosted page in a new tab
   (with amount & frequency appended as query params when supported) and the
   "being set up" fallback panel is hidden. No secret keys live in this file;
   the hosted provider handles all payment processing and receipts.
   ========================================================================= */
(function () {
  "use strict";

  var DONATION_CONFIG = { provider: null, url: null };

  document.addEventListener("DOMContentLoaded", function () {
    var state = { amount: 10, freq: "one-time", custom: null };

    var amountBtns = Array.prototype.slice.call(document.querySelectorAll(".amount-btn"));
    var freqBtns   = Array.prototype.slice.call(document.querySelectorAll(".freq-btn"));
    var customWrap = document.getElementById("customWrap");
    var customInput = document.getElementById("customAmount");
    var customError = document.getElementById("customError");
    var summaryAmount = document.getElementById("summaryAmount");
    var summaryFreq = document.getElementById("summaryFreq");
    var donateBtn = document.getElementById("donateBtn");
    var fallback = document.getElementById("donateFallback");

    var providerLive = !!(DONATION_CONFIG.url && /^https:\/\//i.test(DONATION_CONFIG.url));

    function effectiveAmount() {
      if (state.amount === "custom") {
        var v = parseFloat(state.custom);
        return (isFinite(v) && v >= 1) ? Math.round(v * 100) / 100 : null;
      }
      return state.amount;
    }

    function fmt(n) {
      if (n == null) return "$—";
      return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
    }

    function updateSummary() {
      if (summaryAmount) summaryAmount.textContent = fmt(effectiveAmount());
      if (summaryFreq) summaryFreq.textContent = state.freq === "monthly" ? "per month" : "one time";
    }

    function selectAmount(btn) {
      amountBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-selected", on);
        b.setAttribute("aria-checked", on ? "true" : "false");
      });
      var val = btn.getAttribute("data-amount");
      state.amount = (val === "custom") ? "custom" : parseFloat(val);
      if (customWrap) customWrap.hidden = (val !== "custom");
      if (val === "custom" && customInput) { customInput.focus(); }
      if (val !== "custom" && customError) { customError.textContent = ""; }
      updateSummary();
    }

    amountBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { selectAmount(btn); });
    });

    freqBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        freqBtns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("is-selected", on);
          b.setAttribute("aria-checked", on ? "true" : "false");
        });
        state.freq = btn.getAttribute("data-freq") || "one-time";
        updateSummary();
      });
    });

    if (customInput) {
      customInput.addEventListener("input", function () {
        state.custom = customInput.value;
        var v = parseFloat(customInput.value);
        if (customInput.value === "") {
          if (customError) customError.textContent = "";
        } else if (!isFinite(v) || v < 1) {
          if (customError) customError.textContent = "Please enter an amount of $1 or more.";
        } else if (v > 100000) {
          if (customError) customError.textContent = "Please enter a smaller amount, or contact us about major gifts.";
        } else if (customError) {
          customError.textContent = "";
        }
        updateSummary();
      });
    }

    // ---- Provider gating -------------------------------------------------
    if (providerLive) {
      // Real provider configured: hide the fallback, wire the button.
      if (fallback) fallback.hidden = true;
      if (donateBtn) {
        donateBtn.addEventListener("click", function () {
          var amt = effectiveAmount();
          if (amt == null) {
            if (customError) customError.textContent = "Please choose or enter a valid amount.";
            if (customInput) customInput.focus();
            return;
          }
          var url = DONATION_CONFIG.url;
          // Append amount/frequency hints; harmless for providers that ignore them.
          try {
            var u = new URL(url);
            u.searchParams.set("amount", String(amt));
            u.searchParams.set("recurring", state.freq === "monthly" ? "true" : "false");
            url = u.toString();
          } catch (e) { /* keep base url */ }
          window.open(url, "_blank", "noopener,noreferrer");
        });
      }
    } else {
      // No provider yet: honest configuration-required state.
      // Keep the fallback panel visible and make the primary button route to it
      // instead of pretending a payment is processing.
      if (fallback) fallback.hidden = false;
      if (donateBtn) {
        donateBtn.setAttribute("aria-disabled", "true");
        donateBtn.textContent = "Online giving — coming soon";
        donateBtn.addEventListener("click", function () {
          if (fallback) {
            fallback.scrollIntoView({ behavior: "smooth", block: "center" });
            var firstLink = fallback.querySelector("a");
            if (firstLink) firstLink.focus({ preventScroll: true });
          }
        });
      }
    }

    updateSummary();
  });
})();
