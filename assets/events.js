/* PAWS FOR A CAUSE — Events page logic (vanilla JS, no dependencies)
 * Renders list/agenda + month calendar + filters + search + detail
 * + .ics / Google Calendar + volunteer signup, all from
 * window.PFAC_EVENTS. Degrades gracefully when the array is empty.
 */
(function () {
  "use strict";

  var ORG_EMAIL = "pawsforacausemi@gmail.com";
  var FORMSPREE = "https://formspree.io/f/mblklzkb";
  var INSTAGRAM = "https://www.instagram.com/pawsforacausemi";

  var CATEGORY_ORDER = [
    "Adoption Event", "Shelter Volunteer Shift", "Supply Drive",
    "Pet Food Distribution", "Vaccination Clinic", "Fundraiser",
    "Community Outreach", "Training or Orientation", "Youth Program",
    "Partner Event"
  ];

  var STATUS_LABELS = {
    registration_open: "Registration open",
    almost_full: "Almost full",
    waitlist: "Waitlist",
    registration_closed: "Registration closed",
    completed: "Completed",
    cancelled: "Cancelled"
  };

  // Source data (defensive copy + validation of essentials).
  var DATA = (Array.isArray(window.PFAC_EVENTS) ? window.PFAC_EVENTS : [])
    .filter(function (e) {
      return e && typeof e === "object" && e.slug && e.title && e.startDateTime;
    });

  // ---- small helpers -------------------------------------------------
  function $(sel, root) { return (root || document).querySelector(sel); }
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2), attrs[k]);
        } else if (attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* Parse an ISO local date string ("2026-07-18T10:00:00") as a LOCAL
   * Date in the viewer's browser. We treat the stored time as the wall
   * time in Detroit; for display this is fine, and .ics carries the TZID. */
  function parseLocal(iso) {
    if (!iso) return null;
    var m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (!m) { var d = new Date(iso); return isNaN(d) ? null : d; }
    return new Date(
      +m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)
    );
  }

  var DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var MON = ["January","February","March","April","May","June","July",
             "August","September","October","November","December"];

  function fmtDate(d) {
    if (!d) return "";
    return DOW[d.getDay()] + ", " + MON[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }
  function fmtTime(d) {
    if (!d) return "";
    var h = d.getHours(), m = d.getMinutes();
    var ap = h >= 12 ? "PM" : "AM";
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + (m ? ":" + String(m).padStart(2, "0") : "") + " " + ap;
  }
  function fmtRange(start, end) {
    if (!start) return "";
    if (!end) return fmtDate(start) + " · " + fmtTime(start);
    var sameDay = start.toDateString() === end.toDateString();
    if (sameDay) return fmtDate(start) + " · " + fmtTime(start) + "–" + fmtTime(end);
    return fmtDate(start) + " " + fmtTime(start) + " – " + fmtDate(end) + " " + fmtTime(end);
  }

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  // ---- state ---------------------------------------------------------
  var state = {
    view: "calendar",        // "list" | "calendar" — default to Calendar
    calCursor: startOfMonth(new Date()),
    filters: { category: "", partner: "", availability: "", q: "" }
  };
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }

  // ---- filtering -----------------------------------------------------
  function eventStart(e) { return parseLocal(e.startDateTime); }

  function passesFilters(e) {
    var f = state.filters;
    if (f.category && e.category !== f.category) return false;
    if (f.partner && e.partner !== f.partner) return false;
    if (f.availability && e.status !== f.availability) return false;
    if (f.q) {
      var hay = [e.title, e.shortDescription, e.description, e.locationName,
                 e.city, e.partner, e.category].join(" ").toLowerCase();
      if (hay.indexOf(f.q.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function upcomingFirstSort(a, b) {
    var da = eventStart(a), db = eventStart(b);
    return (da ? da.getTime() : 0) - (db ? db.getTime() : 0);
  }

  // ---- status badge --------------------------------------------------
  function statusBadge(status) {
    var label = STATUS_LABELS[status] || "Scheduled";
    var cls = "pf-badge pf-badge--" + (status || "scheduled").replace(/_/g, "-");
    // Status conveyed by TEXT (label), not color alone.
    return el("span", { class: cls }, [label]);
  }

  // ---- DOM roots -----------------------------------------------------
  var root = $("#pf-events-app");
  if (!root) return;

  var controlsBar = $("#pf-controls");
  var listMount   = $("#pf-list");
  var calMount    = $("#pf-calendar");
  var detailMount = $("#pf-detail");
  var browseMount = $("#pf-browse");

  // =====================================================================
  // ROUTER: ?event=<slug> shows detail, otherwise the browse experience
  // =====================================================================
  function currentSlug() {
    try { return new URLSearchParams(window.location.search).get("event"); }
    catch (err) { return null; }
  }

  function route() {
    var slug = currentSlug();
    if (slug) {
      var ev = DATA.filter(function (e) { return e.slug === slug; })[0];
      if (ev) { showDetail(ev); return; }
    }
    showBrowse();
  }

  // =====================================================================
  // BROWSE (list + calendar + filters)
  // =====================================================================
  function showBrowse() {
    if (detailMount) detailMount.hidden = true;
    if (browseMount) browseMount.hidden = false;
    buildControls();
    render();
  }

  function buildControls() {
    if (!controlsBar || controlsBar.dataset.built === "1") return;
    controlsBar.dataset.built = "1";

    // View toggle
    var toggle = el("div", { class: "pf-toggle", role: "group",
      "aria-label": "Choose how to view events" }, [
      el("button", {
        type: "button", class: "pf-toggle__btn", id: "pf-view-cal",
        "aria-pressed": state.view === "calendar" ? "true" : "false",
        onclick: function () { setView("calendar"); }
      }, ["Calendar"]),
      el("button", {
        type: "button", class: "pf-toggle__btn", id: "pf-view-list",
        "aria-pressed": state.view === "list" ? "true" : "false",
        onclick: function () { setView("list"); }
      }, ["List"])
    ]);

    // Search
    var search = el("div", { class: "pf-search" }, [
      el("label", { class: "pf-visually-hidden", for: "pf-q" }, ["Search events"]),
      el("input", {
        type: "search", id: "pf-q", placeholder: "Search events…",
        autocomplete: "off",
        oninput: function (e) { state.filters.q = e.target.value.trim(); render(); }
      })
    ]);

    // Build filter option sets ONLY from data present
    var cats = uniquePresent(DATA.map(function (e) { return e.category; }))
      .sort(function (a, b) { return CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b); });
    var partners = uniquePresent(DATA.map(function (e) { return e.partner; })).sort();
    var statuses = uniquePresent(DATA.map(function (e) { return e.status; }));

    var filters = el("div", { class: "pf-filters" }, [
      makeSelect("pf-f-cat", "Category", cats, function (v) {
        state.filters.category = v; render();
      }),
      partners.length ? makeSelect("pf-f-partner", "Partner", partners, function (v) {
        state.filters.partner = v; render();
      }) : null,
      statuses.length ? makeSelect("pf-f-avail", "Availability",
        statuses.map(function (s) { return { value: s, label: STATUS_LABELS[s] || s }; }),
        function (v) { state.filters.availability = v; render(); }) : null
    ]);

    controlsBar.appendChild(toggle);
    controlsBar.appendChild(search);
    controlsBar.appendChild(filters);

    // Keep the view toggle visible even with no events so visitors can
    // switch to the calendar grid. When DATA is empty we hide only the
    // filter chips (nothing to filter) but keep the toggle.
    if (DATA.length === 0 && filters && filters.parentNode) {
      filters.hidden = true;
    }
  }

  function uniquePresent(arr) {
    var seen = {}, out = [];
    arr.forEach(function (v) { if (v && !seen[v]) { seen[v] = 1; out.push(v); } });
    return out;
  }

  function makeSelect(id, label, options, onChange) {
    var sel = el("select", {
      id: id, "aria-label": "Filter by " + label.toLowerCase(),
      onchange: function (e) { onChange(e.target.value); }
    }, [el("option", { value: "" }, ["All " + label.toLowerCase() + "s"])]);
    options.forEach(function (o) {
      var value = typeof o === "string" ? o : o.value;
      var text = typeof o === "string" ? o : o.label;
      sel.appendChild(el("option", { value: value }, [text]));
    });
    return el("div", { class: "pf-field pf-field--inline" }, [
      el("label", { class: "pf-visually-hidden", for: id }, ["Filter by " + label]),
      sel
    ]);
  }

  function setView(view) {
    state.view = view;
    var lb = $("#pf-view-list"), cb = $("#pf-view-cal");
    if (lb) lb.setAttribute("aria-pressed", view === "list" ? "true" : "false");
    if (cb) cb.setAttribute("aria-pressed", view === "calendar" ? "true" : "false");
    render();
  }

  function render() {
    var filtered = DATA.filter(passesFilters).sort(upcomingFirstSort);

    // Even when DATA is empty, keep the view toggle + calendar grid visible
    // so visitors can actually SEE the calendar UI. The list view falls back
    // to a friendly empty state in that case.
    if (state.view === "calendar") {
      if (listMount) listMount.hidden = true;
      if (calMount) { calMount.hidden = false; renderCalendar(filtered); }
    } else {
      if (calMount) calMount.hidden = true;
      if (listMount) {
        listMount.hidden = false;
        if (DATA.length === 0) renderEmptyState(listMount, true);
        else renderList(filtered);
      }
    }
  }

  function renderEmptyState(mount, noData) {
    mount.innerHTML = "";
    mount.appendChild(el("div", { class: "pf-empty", role: "status" }, [
      el("div", { class: "pf-empty__icon", "aria-hidden": "true" }, ["🐾"]),
      el("h2", { class: "pf-empty__title" }, [
        noData ? "No upcoming events are posted yet"
               : "No events match your filters"
      ]),
      el("p", { class: "pf-empty__text" }, [
        noData
          ? "We post volunteer days, supply drives, and partner events here as soon as they’re scheduled. Follow us or reach out and we’ll let you know what’s coming up."
          : "Try clearing a filter or your search to see more."
      ]),
      noData
        ? el("div", { class: "pf-empty__cta" }, [
            el("a", {
              class: "pf-btn pf-btn--primary",
              href: INSTAGRAM, target: "_blank", rel: "noopener noreferrer"
            }, ["Follow @pawsforacausemi"]),
            el("a", { class: "pf-btn pf-btn--secondary", href: "contact.html" },
              ["Get in touch"])
          ])
        : el("div", { class: "pf-empty__cta" }, [
            el("button", {
              type: "button", class: "pf-btn pf-btn--secondary",
              onclick: function () { resetFilters(); }
            }, ["Clear filters"])
          ])
    ]));
  }

  function resetFilters() {
    state.filters = { category: "", partner: "", availability: "", q: "" };
    var q = $("#pf-q"); if (q) q.value = "";
    ["pf-f-cat","pf-f-partner","pf-f-avail"].forEach(function (id) {
      var s = $("#" + id); if (s) s.value = "";
    });
    render();
  }

  // ---- LIST / AGENDA -------------------------------------------------
  function renderList(events) {
    listMount.innerHTML = "";
    if (events.length === 0) { renderEmptyState(listMount, false); return; }

    var now = startOfDay(new Date());
    var grid = el("ul", { class: "pf-cards", "aria-label": "Event list" });

    events.forEach(function (e) {
      var start = eventStart(e);
      var past = start && start < now;
      grid.appendChild(renderCard(e, past));
    });
    listMount.appendChild(grid);
  }

  function renderCard(e, past) {
    var start = eventStart(e), end = parseLocal(e.endDateTime);
    var href = "events.html?event=" + encodeURIComponent(e.slug);

    var media = e.featuredImage
      ? el("a", { class: "pf-card__media", href: href, tabindex: "-1", "aria-hidden": "true" }, [
          el("img", { src: e.featuredImage, alt: "", loading: "lazy" })
        ])
      : null;

    var meta = el("ul", { class: "pf-card__meta" }, [
      start ? el("li", null, ["📅 " + fmtRange(start, end)]) : null,
      e.locationName ? el("li", null, [
        "📍 " + e.locationName + (e.city ? " — " + e.city + (e.state ? ", " + e.state : "") : "")
      ]) : null,
      e.category ? el("li", null, ["🏷️ " + e.category]) : null
    ].filter(Boolean));

    return el("li", { class: "pf-card" + (past ? " is-past" : "") }, [
      media,
      el("div", { class: "pf-card__body" }, [
        el("div", { class: "pf-card__badges" }, [statusBadge(e.status)]),
        el("h3", { class: "pf-card__title" }, [
          el("a", { href: href }, [e.title])
        ]),
        e.shortDescription ? el("p", { class: "pf-card__desc" }, [e.shortDescription]) : null,
        meta,
        el("div", { class: "pf-card__foot" }, [
          el("a", { class: "pf-btn pf-btn--primary pf-btn--sm", href: href },
            ["View details & sign up"]),
          (e.spotsRemaining != null)
            ? el("span", { class: "pf-card__spots" },
                [e.spotsRemaining + " of " + (e.capacity != null ? e.capacity : "?") + " spots open*"])
            : null
        ].filter(Boolean))
      ])
    ].filter(Boolean));
  }

  // ---- CALENDAR (month grid) ----------------------------------------
  function renderCalendar(events) {
    calMount.innerHTML = "";
    var cursor = state.calCursor;
    var year = cursor.getFullYear(), month = cursor.getMonth();

    // Map events by yyyy-mm-dd of their start
    var byDay = {};
    events.forEach(function (e) {
      var d = eventStart(e); if (!d) return;
      var key = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
      (byDay[key] = byDay[key] || []).push(e);
    });

    // Header / navigation
    var nav = el("div", { class: "pf-cal__nav" }, [
      el("button", {
        type: "button", class: "pf-btn pf-btn--ghost pf-cal__navbtn",
        "aria-label": "Previous month",
        onclick: function () { state.calCursor = new Date(year, month - 1, 1); render(); }
      }, ["← Prev"]),
      el("h2", { class: "pf-cal__title", "aria-live": "polite" },
        [MON[month] + " " + year]),
      el("div", { class: "pf-cal__navright" }, [
        el("button", {
          type: "button", class: "pf-btn pf-btn--ghost pf-cal__navbtn",
          onclick: function () { state.calCursor = startOfMonth(new Date()); render(); }
        }, ["Today"]),
        el("button", {
          type: "button", class: "pf-btn pf-btn--ghost pf-cal__navbtn",
          "aria-label": "Next month",
          onclick: function () { state.calCursor = new Date(year, month + 1, 1); render(); }
        }, ["Next →"])
      ])
    ]);
    calMount.appendChild(nav);

    // Weekday headings
    var head = el("div", { class: "pf-cal__dow", "aria-hidden": "true" });
    ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function (d) {
      head.appendChild(el("span", null, [d]));
    });
    calMount.appendChild(head);

    // Grid
    var first = new Date(year, month, 1);
    var startPad = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var todayKey = (function () {
      var t = new Date();
      return t.getFullYear() + "-" + t.getMonth() + "-" + t.getDate();
    })();

    var grid = el("div", { class: "pf-cal__grid", role: "grid",
      "aria-label": "Calendar for " + MON[month] + " " + year });

    for (var i = 0; i < startPad; i++) {
      grid.appendChild(el("div", { class: "pf-cal__cell is-empty", role: "gridcell",
        "aria-hidden": "true" }));
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var key = year + "-" + month + "-" + day;
      var dayEvents = byDay[key] || [];
      var cell = el("div", {
        class: "pf-cal__cell" + (key === todayKey ? " is-today" : "") +
               (dayEvents.length ? " has-events" : ""),
        role: "gridcell"
      }, [
        el("span", { class: "pf-cal__date" }, [
          key === todayKey ? el("span", { class: "pf-visually-hidden" }, ["Today, "]) : null,
          String(day)
        ].filter(Boolean))
      ]);

      dayEvents.forEach(function (e) {
        cell.appendChild(el("a", {
          class: "pf-cal__event",
          href: "events.html?event=" + encodeURIComponent(e.slug),
          title: e.title + " — " + fmtTime(eventStart(e))
        }, [
          el("span", { class: "pf-cal__dot", "aria-hidden": "true" }),
          el("span", { class: "pf-cal__etitle" }, [e.title])
        ]));
      });
      grid.appendChild(cell);
    }
    calMount.appendChild(grid);

    // Helpful note + agenda fallback list under the grid for this month
    var monthList = events.filter(function (e) {
      var d = eventStart(e);
      return d && d.getFullYear() === year && d.getMonth() === month;
    });
    if (monthList.length === 0) {
      calMount.appendChild(el("p", { class: "pf-cal__none", role: "status" },
        ["No events scheduled in " + MON[month] + " " + year + "."]));
    }
  }

  // =====================================================================
  // DETAIL VIEW
  // =====================================================================
  function showDetail(e) {
    if (browseMount) browseMount.hidden = true;
    if (detailMount) detailMount.hidden = false;
    detailMount.innerHTML = "";

    document.title = e.title + " | Events | Paws for a Cause";

    var start = eventStart(e), end = parseLocal(e.endDateTime);
    var contactEmail = e.contactEmail || ORG_EMAIL;

    var back = el("a", { class: "pf-back", href: "events.html" },
      ["← Back to all events"]);

    // ---- main column ----
    var mainCol = el("div", { class: "pf-detail__main" }, [
      el("div", { class: "pf-detail__badges" }, [statusBadge(e.status)]),
      el("h1", { class: "pf-detail__title" }, [e.title]),
      e.shortDescription ? el("p", { class: "pf-detail__lead" }, [e.shortDescription]) : null,
      e.featuredImage ? el("img", {
        class: "pf-detail__img", src: e.featuredImage,
        alt: "Photo for " + e.title, loading: "lazy"
      }) : null
    ].filter(Boolean));

    if (e.description) {
      String(e.description).split(/\n+/).forEach(function (p) {
        if (p.trim()) mainCol.appendChild(el("p", { class: "pf-detail__p" }, [p.trim()]));
      });
    }

    if (Array.isArray(e.duties) && e.duties.length) {
      mainCol.appendChild(el("h2", { class: "pf-detail__h" }, ["What you’ll be doing"]));
      mainCol.appendChild(makeList(e.duties));
    }
    if (Array.isArray(e.preparation) && e.preparation.length) {
      mainCol.appendChild(el("h2", { class: "pf-detail__h" }, ["How to prepare"]));
      mainCol.appendChild(makeList(e.preparation));
    }

    // Signup form
    mainCol.appendChild(buildSignupForm(e, contactEmail));

    // ---- sidebar ----
    var facts = el("dl", { class: "pf-facts" }, []);
    addFact(facts, "Date & time", start ? fmtRange(start, end) : "To be announced");
    addFact(facts, "Location", locationText(e));
    if (e.partner) addFact(facts, "Partner", e.partner);
    if (e.category) addFact(facts, "Category", e.category);
    addFact(facts, "Status", STATUS_LABELS[e.status] || "Scheduled");
    if (e.minimumAge != null) addFact(facts, "Minimum age", e.minimumAge + "+");
    if (e.registrationDeadline) {
      var dl = parseLocal(e.registrationDeadline);
      if (dl) addFact(facts, "Register by", fmtDate(dl) + " · " + fmtTime(dl));
    }
    if (e.capacity != null || e.spotsRemaining != null) {
      var capText = (e.spotsRemaining != null ? e.spotsRemaining + " open" : "") +
        (e.capacity != null ? (e.spotsRemaining != null ? " of " : "") + e.capacity + " total" : "");
      addFact(facts, "Capacity", capText + " (informational)");
    }

    var canRegister = ["registration_open", "almost_full", "waitlist"].indexOf(e.status) !== -1;

    var sideActions = el("div", { class: "pf-detail__actions" }, [
      canRegister
        ? el("a", { class: "pf-btn pf-btn--primary pf-btn--block", href: "#pf-signup" },
            ["Sign up to volunteer"])
        : el("p", { class: "pf-detail__closednote" }, [
            e.status === "cancelled" ? "This event has been cancelled." :
            e.status === "completed" ? "This event has already taken place." :
            "Registration for this event is closed."
          ]),
      start ? el("button", {
        type: "button", class: "pf-btn pf-btn--secondary pf-btn--block",
        onclick: function () { downloadICS(e); }
      }, ["Add to calendar (.ics)"]) : null,
      start ? el("a", {
        class: "pf-btn pf-btn--ghost pf-btn--block",
        href: googleCalUrl(e), target: "_blank", rel: "noopener noreferrer"
      }, ["Add to Google Calendar"]) : null
    ].filter(Boolean));

    var sideCol = el("aside", { class: "pf-detail__side", "aria-label": "Event details" }, [
      el("div", { class: "pf-detail__card" }, [facts, sideActions])
    ]);

    detailMount.appendChild(back);
    detailMount.appendChild(el("div", { class: "pf-detail__grid" }, [mainCol, sideCol]));
    detailMount.appendChild(el("p", { class: "pf-detail__moreback" }, [
      el("a", { class: "pf-back", href: "events.html" }, ["← Back to all events"])
    ]));

    if (window.PFAC && typeof window.PFAC.stampYear === "function") {}
  }

  function makeList(items) {
    return el("ul", { class: "pf-detail__list" },
      items.map(function (it) { return el("li", null, [String(it)]); }));
  }
  function addFact(dl, term, val) {
    if (val == null || val === "") return;
    dl.appendChild(el("div", { class: "pf-facts__row" }, [
      el("dt", null, [term]),
      el("dd", null, [val])
    ]));
  }
  function locationText(e) {
    var parts = [];
    if (e.locationName) parts.push(e.locationName);
    var line2 = [e.address, e.city, e.state].filter(Boolean).join(", ");
    if (line2) parts.push(line2);
    return parts.join(" — ");
  }

  // ---- SIGNUP FORM ---------------------------------------------------
  function buildSignupForm(e, contactEmail) {
    var canRegister = ["registration_open", "almost_full", "waitlist"].indexOf(e.status) !== -1;
    var wrap = el("section", { class: "pf-signup", id: "pf-signup",
      "aria-labelledby": "pf-signup-h" }, [
      el("h2", { id: "pf-signup-h", class: "pf-detail__h" }, ["Volunteer sign-up"])
    ]);

    if (!canRegister) {
      wrap.appendChild(el("p", { class: "pf-detail__p" }, [
        "Sign-ups aren’t open for this event. Questions? Email ",
        el("a", { href: "mailto:" + contactEmail }, [contactEmail]), "."
      ]));
      return wrap;
    }

    // Honest note about no live capacity
    wrap.appendChild(el("p", { class: "pf-note" }, [
      "Submitting this form lets our team know you’re interested—it does not " +
      "instantly reserve a spot. A coordinator will confirm your spot by email" +
      (e.spotsRemaining != null ? " (any “spots open” shown above are informational)" : "") +
      "."
    ]));

    var form = el("form", {
      class: "pf-form", id: "pf-signup-form", action: FORMSPREE,
      method: "POST", novalidate: "novalidate"
    });

    // hidden fields
    form.appendChild(hidden("_subject", "Volunteer sign-up: " + e.title));
    form.appendChild(hidden("_captcha", "false"));
    form.appendChild(hidden("event", e.title + " (" + e.slug + ")"));
    form.appendChild(hidden("eventSlug", e.slug));

    // name
    form.appendChild(field("Full name", "pf-name", el("input", {
      type: "text", name: "fullName", id: "pf-name",
      required: "required", autocomplete: "name"
    }), true));

    // email + phone
    form.appendChild(el("div", { class: "pf-form__row pf-form__row--2" }, [
      field("Email", "pf-email", el("input", {
        type: "email", name: "email", id: "pf-email",
        required: "required", autocomplete: "email"
      }), true),
      field("Phone (optional)", "pf-phone", el("input", {
        type: "tel", name: "phone", id: "pf-phone", autocomplete: "tel"
      }), false)
    ]));

    // age range + group size
    var ageSel = el("select", { name: "ageRange", id: "pf-age", required: "required" }, [
      el("option", { value: "" }, ["Select…"]),
      el("option", { value: "Under 13" }, ["Under 13"]),
      el("option", { value: "13-15" }, ["13–15"]),
      el("option", { value: "16-17" }, ["16–17"]),
      el("option", { value: "18 or older" }, ["18 or older"])
    ]);
    form.appendChild(el("div", { class: "pf-form__row pf-form__row--2" }, [
      field("Age range", "pf-age", ageSel, true),
      field("Group size", "pf-group", el("input", {
        type: "number", name: "groupSize", id: "pf-group",
        min: "1", value: "1", required: "required"
      }), true)
    ]));

    // school / org
    form.appendChild(field("School / organization (optional)", "pf-school", el("input", {
      type: "text", name: "schoolOrg", id: "pf-school", autocomplete: "organization"
    }), false));

    // guardian block (shown only for minors)
    var guardianBlock = el("div", {
      class: "pf-guardian", id: "pf-guardian", hidden: "hidden"
    }, [
      el("p", { class: "pf-guardian__note" }, [
        "Because this volunteer is under 18, a parent or guardian’s details are required."
      ]),
      el("div", { class: "pf-form__row pf-form__row--2" }, [
        field("Parent / guardian name", "pf-gname", el("input", {
          type: "text", name: "guardianName", id: "pf-gname", autocomplete: "name"
        }), true),
        field("Parent / guardian email", "pf-gemail", el("input", {
          type: "email", name: "guardianEmail", id: "pf-gemail", autocomplete: "email"
        }), true)
      ])
    ]);
    form.appendChild(guardianBlock);

    // accommodations + notes
    form.appendChild(field("Accessibility needs / accommodations (optional)", "pf-acc",
      el("textarea", { name: "accommodations", id: "pf-acc", rows: "2" }), false));
    form.appendChild(field("Anything else? (optional)", "pf-notes",
      el("textarea", { name: "notes", id: "pf-notes", rows: "3" }), false));

    // waiver acknowledgment (required only if waiverRequired)
    if (e.waiverRequired) {
      var waiverWrap = el("div", { class: "pf-check pf-field", id: "pf-waiver-wrap" }, [
        el("label", { class: "pf-check__label" }, [
          el("input", { type: "checkbox", name: "waiverAck", id: "pf-waiver",
            value: "yes", required: "required" }),
          el("span", null, ["I understand a signed liability waiver is required for this event " +
            "and I will complete it before participating."])
        ]),
        errorSlot("pf-waiver")
      ]);
      form.appendChild(waiverWrap);
    }

    // email consent (optional)
    form.appendChild(el("div", { class: "pf-check pf-field" }, [
      el("label", { class: "pf-check__label" }, [
        el("input", { type: "checkbox", name: "emailConsent", id: "pf-consent", value: "yes" }),
        el("span", null, ["Email me about future PAWS FOR A CAUSE volunteer opportunities (optional)."])
      ])
    ]));

    // submit + status
    var submitBtn = el("button", { type: "submit", class: "pf-btn pf-btn--primary",
      id: "pf-submit" }, ["Submit sign-up"]);
    form.appendChild(submitBtn);
    var status = el("p", { class: "pf-form__status", id: "pf-form-status",
      "aria-live": "polite", role: "status" });
    form.appendChild(status);

    // ---- behavior: guardian toggle ----
    function syncGuardian() {
      var v = ageSel.value;
      var minor = v === "Under 13" || v === "13-15" || v === "16-17";
      guardianBlock.hidden = !minor;
      var gName = $("#pf-gname", form), gEmail = $("#pf-gemail", form);
      if (gName) gName.required = minor;
      if (gEmail) gEmail.required = minor;
    }
    ageSel.addEventListener("change", syncGuardian);
    syncGuardian();

    // ---- behavior: submit ----
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      clearErrors(form);

      var errors = validate(form, e);
      if (errors.length) {
        errors[0].field.focus();
        status.textContent = "Please fix the highlighted fields and try again.";
        status.className = "pf-form__status is-error";
        return;
      }

      submitBtn.disabled = true;
      var origText = submitBtn.textContent;
      submitBtn.textContent = "Submitting…";
      status.textContent = "";
      status.className = "pf-form__status";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (res) {
        if (res.ok) {
          form.reset();
          syncGuardian();
          status.textContent = "Thanks! Your sign-up was sent. A coordinator will confirm your spot by email soon.";
          status.className = "pf-form__status is-success";
        } else {
          return res.json().then(function (d) {
            var msg = d && d.errors ? d.errors.map(function (x) { return x.message; }).join(", ")
                                    : "Please try again.";
            throw new Error(msg);
          });
        }
      }).catch(function (err) {
        status.textContent = "Sorry, something went wrong sending your sign-up. " +
          (err && err.message ? err.message + " " : "") +
          "You can also email " + contactEmail + ".";
        status.className = "pf-form__status is-error";
      }).then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = origText;
      });
    });

    return wrap.appendChild(form), wrap;
  }

  function hidden(name, value) {
    return el("input", { type: "hidden", name: name, value: value });
  }
  function errorSlot(forId) {
    return el("span", { class: "pf-error", id: forId + "-err", "aria-live": "polite" });
  }
  function field(labelText, id, control, required) {
    control.setAttribute("aria-describedby", id + "-err");
    return el("div", { class: "pf-field" }, [
      el("label", { for: id, class: "pf-label" }, [
        labelText,
        required ? el("span", { class: "pf-req", "aria-hidden": "true" }, [" *"]) : null
      ].filter(Boolean)),
      control,
      errorSlot(id)
    ]);
  }

  function setError(field, msg) {
    var slot = document.getElementById(field.id + "-err");
    if (slot) slot.textContent = msg;
    field.classList.add("is-invalid");
    field.setAttribute("aria-invalid", "true");
  }
  function clearErrors(form) {
    Array.prototype.forEach.call(form.querySelectorAll(".pf-error"), function (s) {
      s.textContent = "";
    });
    Array.prototype.forEach.call(form.querySelectorAll(".is-invalid"), function (f) {
      f.classList.remove("is-invalid");
      f.removeAttribute("aria-invalid");
    });
    var st = $("#pf-form-status", form);
    if (st) { st.textContent = ""; st.className = "pf-form__status"; }
  }

  function validate(form, e) {
    var errs = [];
    function req(id, msg) {
      var f = $("#" + id, form);
      if (f && !String(f.value).trim()) { setError(f, msg); errs.push({ field: f }); }
      return f;
    }
    req("pf-name", "Please enter your full name.");
    var email = $("#pf-email", form);
    if (email) {
      var v = email.value.trim();
      if (!v) { setError(email, "Please enter your email."); errs.push({ field: email }); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        setError(email, "Please enter a valid email address."); errs.push({ field: email });
      }
    }
    var age = $("#pf-age", form);
    if (age && !age.value) { setError(age, "Please choose an age range."); errs.push({ field: age }); }
    var group = $("#pf-group", form);
    if (group) {
      var g = parseInt(group.value, 10);
      if (!(g >= 1)) { setError(group, "Group size must be at least 1."); errs.push({ field: group }); }
    }
    // guardian required if minor
    if (age && (age.value === "Under 13" || age.value === "13-15" || age.value === "16-17")) {
      req("pf-gname", "Please enter a parent or guardian name.");
      var ge = $("#pf-gemail", form);
      if (ge) {
        var gv = ge.value.trim();
        if (!gv) { setError(ge, "Please enter a parent or guardian email."); errs.push({ field: ge }); }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(gv)) {
          setError(ge, "Please enter a valid email."); errs.push({ field: ge });
        }
      }
    }
    // waiver
    if (e.waiverRequired) {
      var w = $("#pf-waiver", form);
      if (w && !w.checked) {
        setError(w, "Please acknowledge the waiver requirement.");
        errs.push({ field: w });
      }
    }
    return errs;
  }

  // =====================================================================
  // CALENDAR EXPORT (.ics + Google) — America/Detroit
  // =====================================================================
  function pad(n) { return String(n).padStart(2, "0"); }
  function icsLocal(d) {
    // floating-with-TZID local time format: YYYYMMDDTHHMMSS
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      "T" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
  }
  function icsUTCStamp() {
    var d = new Date();
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) +
      "T" + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }
  function icsEscape(s) {
    return String(s == null ? "" : s)
      .replace(/\\/g, "\\\\").replace(/;/g, "\\;")
      .replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }

  // VTIMEZONE for America/Detroit (US Eastern rules) so times are correct.
  var VTIMEZONE = [
    "BEGIN:VTIMEZONE",
    "TZID:America/Detroit",
    "X-LIC-LOCATION:America/Detroit",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE"
  ];

  function buildICS(e) {
    var start = eventStart(e);
    var end = parseLocal(e.endDateTime) ||
      (start ? new Date(start.getTime() + 2 * 3600 * 1000) : null);
    if (!start) return null;
    var loc = [e.locationName, e.address, e.city, e.state].filter(Boolean).join(", ");
    var desc = (e.shortDescription || e.description || "") +
      "\n\nDetails: " + window.location.origin + window.location.pathname +
      "?event=" + e.slug;

    var lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PAWS FOR A CAUSE//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ].concat(VTIMEZONE).concat([
      "BEGIN:VEVENT",
      "UID:" + (e.id || e.slug) + "@pawsforacausemi.org",
      "DTSTAMP:" + icsUTCStamp(),
      "DTSTART;TZID=America/Detroit:" + icsLocal(start),
      "DTEND;TZID=America/Detroit:" + icsLocal(end),
      "SUMMARY:" + icsEscape(e.title),
      "LOCATION:" + icsEscape(loc),
      "DESCRIPTION:" + icsEscape(desc),
      "END:VEVENT",
      "END:VCALENDAR"
    ]);
    return lines.join("\r\n");
  }

  function downloadICS(e) {
    var ics = buildICS(e);
    if (!ics) return;
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = el("a", { href: url, download: (e.slug || "event") + ".ics" });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function googleCalUrl(e) {
    var start = eventStart(e);
    var end = parseLocal(e.endDateTime) ||
      (start ? new Date(start.getTime() + 2 * 3600 * 1000) : null);
    if (!start) return "#";
    var loc = [e.locationName, e.address, e.city, e.state].filter(Boolean).join(", ");
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: e.title,
      dates: icsLocal(start) + "/" + icsLocal(end),
      ctz: "America/Detroit",
      details: (e.shortDescription || e.description || ""),
      location: loc
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  // Re-route on back/forward (query param change)
  window.addEventListener("popstate", route);

  // boot
  route();
})();
