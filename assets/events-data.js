/*
 * PAWS FOR A CAUSE — Events data (single source of truth)
 * ---------------------------------------------------------
 * This file is the ONLY place event data lives. The Events page
 * (events.html) reads window.PFAC_EVENTS and renders everything
 * client-side: the list/agenda view, the month calendar, filters,
 * search, the per-event detail view, and the volunteer signup form.
 *
 * HONESTY NOTE: We do not fabricate events. The array below is
 * intentionally EMPTY until real events are scheduled. When the
 * array is empty, the page shows a friendly empty state — it never
 * shows fake events, fake stats, or fake "spots remaining".
 *
 * HOW TO ADD AN EVENT:
 *   1. Copy the commented example object below.
 *   2. Fill in every field with REAL information.
 *   3. Paste it into the PFAC_EVENTS array (comma-separated).
 *   4. Keep "slug" unique and URL-safe (lowercase, hyphens) —
 *      it powers the detail link events.html?event=<slug>.
 *
 * DATE FORMAT: Use ISO 8601 local time for America/Detroit, with NO
 * trailing "Z" (e.g. "2026-07-18T10:00:00"). The page formats and
 * builds .ics / Google Calendar links using America/Detroit.
 *
 * ----------------------------------------------------------------
 * SCHEMA — every field, with allowed values. (Commented out so it
 * never renders, but kept as the canonical reference.)
 * ----------------------------------------------------------------
 *
 * {
 *   // Unique stable identifier (any unique string).
 *   id: "evt-0001",
 *
 *   // URL-safe unique slug used in events.html?event=<slug>
 *   slug: "summer-adoption-day-mason",
 *
 *   // Short, human title.
 *   title: "Summer Adoption Day",
 *
 *   // One-line teaser shown on cards / calendar (plain text, ~140 chars).
 *   shortDescription: "Help adopters meet adoptable dogs and cats.",
 *
 *   // Full description for the detail page. Plain text; line breaks
 *   // (\n) are preserved as paragraphs.
 *   description: "Join us at the shelter to greet visitors, walk dogs, "
 *     + "and help families find their new best friend.",
 *
 *   // ISO local time, America/Detroit, no "Z".
 *   startDateTime: "2026-07-18T10:00:00",
 *   endDateTime:   "2026-07-18T14:00:00",
 *
 *   // Where it happens.
 *   locationName: "Ingham County Animal Control & Shelter",
 *   address: "600 Buhl St",
 *   city: "Mason",
 *   state: "MI",
 *
 *   // Partner organization name, or null if none.
 *   partner: "Ingham County Animal Control and Shelter",
 *
 *   // EXACTLY ONE of:
 *   //   "Adoption Event" | "Shelter Volunteer Shift" | "Supply Drive"
 *   //   | "Pet Food Distribution" | "Vaccination Clinic" | "Fundraiser"
 *   //   | "Community Outreach" | "Training or Orientation"
 *   //   | "Youth Program" | "Partner Event"
 *   category: "Adoption Event",
 *
 *   // Minimum volunteer age (number) or null for all ages.
 *   minimumAge: 13,
 *
 *   // Total volunteer capacity (number) or null if not tracked.
 *   capacity: 20,
 *
 *   // Spots remaining (number) or null if not tracked. DISPLAY ONLY —
 *   // the static site cannot truly reserve a spot; a coordinator confirms.
 *   spotsRemaining: 8,
 *
 *   // ISO local time deadline to register, or null.
 *   registrationDeadline: "2026-07-16T23:59:00",
 *
 *   // EXACTLY ONE of:
 *   //   "registration_open" | "almost_full" | "waitlist"
 *   //   | "registration_closed" | "completed" | "cancelled"
 *   status: "registration_open",
 *
 *   // What volunteers will do (array of short strings).
 *   duties: ["Greet visitors", "Walk dogs", "Help with paperwork"],
 *
 *   // How to prepare (array of short strings).
 *   preparation: ["Wear closed-toe shoes", "Bring a water bottle"],
 *
 *   // Whether a signed waiver is required (true/false).
 *   waiverRequired: true,
 *
 *   // Contact email for this event (defaults to org email if omitted).
 *   contactEmail: "pawsforacausemi@gmail.com",
 *
 *   // Path to an existing image in /images, or null.
 *   featuredImage: "images/Homepage.jpg"
 * }
 *
 * ----------------------------------------------------------------
 */

window.PFAC_EVENTS = [];
