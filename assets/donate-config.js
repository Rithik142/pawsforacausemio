/* =========================================================================
   PAWS FOR A CAUSE — Donation configuration (single source of truth)
   -------------------------------------------------------------------------
   Everything the donation page reads lives here so tiers, copy, limits, and
   Stripe links can be changed in ONE place without touching markup or logic.

   HOW PAYMENTS WORK ON THIS SITE
   This is a static site (GitHub Pages) with no server, so payments are handled
   entirely by Stripe-hosted Payment Links. Stripe validates the amount, takes
   the card, emails the receipt, and (for monthly gifts) manages/cancels the
   subscription via its hosted Customer Portal. No card data ever touches this
   site and no secret keys live in this file.

   TO GO FULLY LIVE, paste Stripe Payment Link URLs into `links` below:
     • Monthly tiers ($25/$50/$100): create a RECURRING (monthly) Payment Link
       for each price in the Stripe Dashboard and paste its URL.
     • Monthly custom: create a recurring "let customers choose what to pay"
       Payment Link (set a sensible minimum) and paste its URL.
     • One-time: create a one-time "let customers choose what to pay" Payment
       Link and paste it as oneTime.custom (donors confirm the exact amount on
       Stripe's secure page). Optionally add fixed-amount links per preset.

   SAFETY: if a link is null, that option is disabled with a clear message —
   the page will NEVER route a monthly selection to a one-time link (or vice
   versa), so a recurring gift can't accidentally be charged once, etc.
   ========================================================================= */
window.PAWS_DONATE = {
  org: {
    legalName: "Paws for a Cause MI",
    // NOTE: confirm this EIN is correct before relying on it for tax receipts.
    ein: "38-4362534",
    donationEmail: "pawsforacausemi@gmail.com",
    currency: "USD",
    symbol: "$"
  },

  /* Client-side guardrails for the custom amount. Stripe enforces the real
     min/max server-side on the Payment Link; these just give friendly errors. */
  limits: { min: 5, max: 100000 },

  /* Stripe Payment Link URLs. null = not set up yet (option is disabled
     gracefully). The existing general link is used for one-time giving. */
  links: {
    monthly: {
      25: null,        // recurring $25/mo Payment Link
      50: null,        // recurring $50/mo Payment Link
      100: null,       // recurring $100/mo Payment Link
      custom: null     // recurring "choose amount" Payment Link
    },
    oneTime: {
      // Optional: map specific preset amounts to dedicated fixed-amount links,
      // e.g. { 100: "https://buy.stripe.com/xxxx" }. Amounts not listed here
      // use `custom` (donor enters/confirms the amount on Stripe's page).
      preset: {},
      custom: "https://buy.stripe.com/dRm9ATauZ8l51RO5ADf7i00"
    }
  },

  /* Stripe-hosted Customer Portal login link for "Manage my giving".
     Create at Dashboard → Settings → Billing → Customer portal, then paste the
     portal link here. null hides the management link. */
  managePortalUrl: null,

  /* Monthly tiers — featured tier is emphasized with the brand accent. */
  monthlyTiers: [
    {
      amount: 25,
      name: "PAWS Companion",
      desc: "Supports outreach materials, volunteer supplies, and promotion for shelter and rescue partners."
    },
    {
      amount: 50,
      name: "Shelter Advocate",
      featured: true,
      desc: "Supports volunteer events, training resources, supply drives, and animal-welfare education."
    },
    {
      amount: 100,
      name: "Community Champion",
      desc: "Helps fund larger community events, reusable educational materials, and sustained partner projects."
    }
  ],

  /* One-time preset amounts (last one renders as "$5,000+"). */
  oneTimePresets: [25, 50, 100, 250, 500, 1000, 2500, 5000],

  /* Configurable tax-acknowledgment language (review with the organization). */
  taxLine:
    "PAWS FOR A CAUSE is recognized as tax-exempt under Internal Revenue Code Section 501(c)(3). " +
    "Contributions may be tax deductible to the extent permitted by law. Please retain your emailed receipt for your records."
};
