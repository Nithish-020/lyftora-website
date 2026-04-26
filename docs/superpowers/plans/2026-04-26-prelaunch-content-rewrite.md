# Pre-launch Content Rewrite Implementation Plan (Phase 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the live site into pre-launch mode — hide pricing, replace mailto CTAs with a canonical waitlist form (markup-only stub for now; Phase 3 wires Resend), strip concrete pricing references, redesign the coach-ai price-chart section into a features comparison, and restyle the coach-ai FAQ.

**Architecture:** Surgical edits to existing files. New `css/waitlist.css` for waitlist form + pre-launch banner + features-vs styles. Updates to `js/navbar.js`, `js/footer.js`, `js/index.js`, `js/coach-ai.js`. HTML edits to `index.html`, `lyftora-coach-ai.html`, `pricing.html`, `sitemap.xml`. No build step — static site on Cloudflare Pages.

**Tech Stack:** Vanilla HTML/CSS/JS. No framework.

**Spec:** [docs/superpowers/specs/2026-04-26-prelaunch-content-rewrite-design.md](../specs/2026-04-26-prelaunch-content-rewrite-design.md)

**Verification model:** Static site, no test runner. Each task ends with explicit grep + manual browser verification steps.

---

## Important: current state vs. spec

The spec was written assuming `index.html` looked shipped (with FAQ + concrete prices + "Get Lyftora" CTAs). Reality after recent commits: **`index.html` is already in pre-launch tone** (badge "We're building something", mailto-based CTAs, build-status section). Phase 1 was also partially completed organically — `js/footer.js` exists; coach-ai's inline `<header class="bar">` is already gone. Therefore the actual delta for Phase 2 is smaller than the spec implies. This plan reflects current state.

What still needs Phase 2 work:

- `js/navbar.js` — still references Pricing + "Get Lyftora" CTA → `pricing.html`.
- `js/footer.js` — Product column still includes Pricing; no pre-launch meta line.
- `index.html` — uses `mailto:` CTAs (not a form), still has concrete ₹ figures (`₹299`, `₹499`), badge says "We're building something" (not the canonical "PRE-LAUNCH · COMING SOON").
- `lyftora-coach-ai.html` — final CTA still links to `pricing.html`; price-chart section + FAQ unchanged.
- `pricing.html` — no `noindex` meta; still in `sitemap.xml`.
- No `css/waitlist.css` yet.

CSS extraction of footer styles (Phase 1 unfinished item) is **out of scope here** — footer renders fine; we'll handle it separately if needed.

---

## File Structure

| File | Purpose | Action |
|---|---|---|
| `js/navbar.js` | Shared navbar | Modify (drop Pricing, change CTA) |
| `js/footer.js` | Shared footer | Modify (drop Pricing, add pre-launch meta) |
| `pricing.html` | Pricing page | Modify (add `noindex`) |
| `sitemap.xml` | Site index | Modify (remove `/pricing`) |
| `css/waitlist.css` | Waitlist form + banner + features-vs styles | Create |
| `index.html` | Home / pre-launch landing | Modify (waitlist forms, strip ₹, badge) |
| `js/index.js` | Index page JS | Modify (stub waitlist handler) |
| `lyftora-coach-ai.html` | Coach AI page | Modify (banner, repoint CTA, swap chart, FAQ markup) |
| `css/coach-ai.css` | Coach AI styles | Modify (drop pchart, add VS, FAQ restyle) |
| `js/coach-ai.js` | Coach AI JS | Modify (FAQ animation fix) |

---

### Task 1: Update `js/navbar.js` — drop Pricing entry and repoint CTA to waitlist anchor

**Files:**
- Modify: `js/navbar.js:16-23`

- [ ] **Step 1: Edit the `PAGES` array and CTA constants**

In `js/navbar.js`, change this block (lines 16–23 in the original — locate by searching for `PAGES = [`):

```javascript
  const PAGES = [
    { label: 'Home',     href: 'index.html',            key: 'home'     },
    { label: 'Coach AI', href: 'lyftora-coach-ai.html', key: 'coach-ai' },
    { label: 'Pricing',  href: 'pricing.html',          key: 'pricing'  },
  ];

  const CTA_HREF  = 'pricing.html';
  const CTA_LABEL = 'Get Lyftora';
```

To:

```javascript
  const PAGES = [
    { label: 'Home',     href: 'index.html',            key: 'home'     },
    { label: 'Coach AI', href: 'lyftora-coach-ai.html', key: 'coach-ai' },
  ];

  const CTA_HREF  = 'index.html#waitlist';
  const CTA_LABEL = 'Join waitlist';
```

- [ ] **Step 2: Remove the pricing branch from `detectActivePage`**

Locate the function (search for `detectActivePage`). Remove the line:

```javascript
    if (path.includes('pricing') || path.includes('/plans')) return 'pricing';
```

(Leave the other branches for `home` and `coach-ai` intact.)

- [ ] **Step 3: Update the file header comment**

Change the JSDoc list at the top from:

```
 *   Home      → index.html
 *   Coach AI  → lyftora-coach-ai.html
 *   Pricing   → pricing.html
```

To:

```
 *   Home      → index.html
 *   Coach AI  → lyftora-coach-ai.html
```

- [ ] **Step 4: Verify**

```bash
grep -n "Pricing\|pricing.html" js/navbar.js
```

Expected: **no output**.

```bash
grep -n "index.html#waitlist\|Join waitlist" js/navbar.js
```

Expected: shows `CTA_HREF` and `CTA_LABEL` lines.

- [ ] **Step 5: Commit**

```bash
git add js/navbar.js
git commit -m "feat(nav): drop pricing link, repoint CTA to waitlist anchor"
```

---

### Task 2: Update `js/footer.js` — drop Pricing list item, add pre-launch meta line

**Files:**
- Modify: `js/footer.js`

- [ ] **Step 1: Remove the Pricing `<li>` from the Product column**

In the footer template literal, locate:

```javascript
          <li><a href="${BASE}index.html#features">Features</a></li>
          <li><a href="${BASE}pricing.html">Pricing</a></li>
          <li><a href="${BASE}lyftora-coach-ai.html">Coach AI</a></li>
          <li><a href="${BASE}index.html#faq">FAQ</a></li>
```

Delete the Pricing line. Result:

```javascript
          <li><a href="${BASE}index.html#features">Features</a></li>
          <li><a href="${BASE}lyftora-coach-ai.html">Coach AI</a></li>
          <li><a href="${BASE}index.html#faq">FAQ</a></li>
```

- [ ] **Step 2: Add the pre-launch meta line in `.foot-bottom`**

Find:

```javascript
    <div class="foot-bottom">
      <div>&copy; ${new Date().getFullYear()} Lyftora &middot; Made with care.</div>
    </div>
```

Replace with:

```javascript
    <div class="foot-bottom">
      <div>&copy; ${new Date().getFullYear()} Lyftora &middot; Made with care.</div>
      <div>Pre-launch &middot; Coming soon</div>
    </div>
```

- [ ] **Step 3: Verify**

```bash
grep -n "pricing.html\|Pre-launch" js/footer.js
```

Expected: shows the `Pre-launch · Coming soon` line, NO `pricing.html` references in the Product list (the `BASE` template still has none after the edit).

- [ ] **Step 4: Commit**

```bash
git add js/footer.js
git commit -m "feat(footer): drop pricing link, add pre-launch meta line"
```

---

### Task 3: Hide `pricing.html` (noindex meta + remove from sitemap)

**Files:**
- Modify: `pricing.html` (head)
- Modify: `sitemap.xml`

- [ ] **Step 1: Add `noindex` meta to `pricing.html`**

In `pricing.html`, locate the `<head>` (find the first `<meta` tag after `<title>`). Add this line immediately after the existing `<title>...</title>`:

```html
<meta name="robots" content="noindex, nofollow" />
```

- [ ] **Step 2: Remove `/pricing` entry from `sitemap.xml`**

Open `sitemap.xml`. Delete the `<url>` block for pricing:

```xml
  <url>
    <loc>https://lyftora.in/pricing</loc>
    <lastmod>2026-04-25</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
```

- [ ] **Step 3: Verify**

```bash
grep -n "robots" pricing.html
```

Expected: shows the `noindex, nofollow` line.

```bash
grep -n "pricing" sitemap.xml
```

Expected: **no output**.

- [ ] **Step 4: Commit**

```bash
git add pricing.html sitemap.xml
git commit -m "chore(seo): hide pricing.html from search and sitemap during pre-launch"
```

---

### Task 4: Create `css/waitlist.css` — form + banner + features-vs styles

**Files:**
- Create: `css/waitlist.css`

This single file holds three concerns (waitlist form, coach-ai pre-launch banner, features-vs grid) so we link only one extra stylesheet per page in later tasks.

- [ ] **Step 1: Create `css/waitlist.css`**

Write exactly this content:

```css
/* ── Waitlist form ── */
.waitlist {
  max-width: 480px;
  margin-inline: auto;
}
.waitlist-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px;
  border: 1px solid rgba(14, 14, 18, .18);
  border-radius: 999px;
  background: #fff;
}
@media (min-width: 540px) {
  .waitlist-form {
    flex-direction: row;
    align-items: center;
  }
}
.waitlist-form input {
  flex: 1;
  border: 0;
  background: transparent;
  padding: 12px 18px;
  font: inherit;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  min-width: 0;
}
.waitlist-form input::placeholder {
  color: var(--muted);
}
.waitlist-form button {
  border: 0;
  border-radius: 999px;
  background: var(--ink);
  color: var(--cream);
  padding: 12px 22px;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s;
}
.waitlist-form button:hover {
  background: var(--coral);
}
.waitlist-status {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  min-height: 1em;
  margin-top: 8px;
}
.waitlist-status.is-error { color: var(--coral); }
.waitlist-status.is-success { color: #2a8c4f; }
.waitlist-microcopy {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  margin-top: 14px;
  letter-spacing: .04em;
}

/* ── Coach-AI pre-launch banner ── */
.prelaunch-banner {
  background: var(--ink);
  color: var(--cream);
  padding: 14px clamp(16px, 4vw, 40px);
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 12.5px;
  letter-spacing: .04em;
  text-align: center;
}
.prelaunch-banner a {
  color: var(--lime);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
}
.prelaunch-banner a:hover { color: var(--cream); }

/* ── Features comparison (replaces price chart on coach-ai) ── */
.vs-wrap { display: block; }
.vs-head { max-width: 60ch; margin-bottom: 48px; }
.vs-head h3 {
  font-family: var(--serif);
  font-weight: 400;
  font-size: clamp(36px, 5vw, 72px);
  line-height: .95;
  letter-spacing: -.03em;
}
.vs-head h3 em { font-style: italic; color: var(--coral); }
.vs-head p {
  color: var(--muted);
  margin-top: 14px;
  max-width: 50ch;
  line-height: 1.55;
}
.vs-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
@media (min-width: 760px) { .vs-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1080px) { .vs-grid { grid-template-columns: repeat(4, 1fr); } }
.vs-col {
  border: 1px solid rgba(14, 14, 18, .18);
  border-radius: 20px;
  padding: 28px 22px;
  background: rgba(255, 255, 255, .4);
}
.vs-col-win {
  background: var(--ink);
  color: var(--cream);
  border-color: var(--ink);
}
.vs-col-h {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: var(--muted);
  margin-bottom: 22px;
  font-weight: 600;
}
.vs-col-win .vs-col-h { color: var(--lime); }
.vs-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.vs-list li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  font-size: 15px;
  line-height: 1.45;
}
.vs-glyph {
  font-family: var(--mono);
  width: 18px;
  flex: 0 0 auto;
  color: var(--coral);
  font-weight: 600;
}
.vs-col-win .vs-glyph { color: var(--lime); }
```

- [ ] **Step 2: Verify**

```bash
test -f css/waitlist.css && grep -c "waitlist-form\|prelaunch-banner\|vs-grid" css/waitlist.css
```

Expected: a number ≥ `3` (the three feature blocks are present).

- [ ] **Step 3: Commit**

```bash
git add css/waitlist.css
git commit -m "feat(css): add waitlist form, pre-launch banner, and features-vs styles"
```

---

### Task 5: Replace `mailto:` CTAs in `index.html` with the canonical waitlist form

**Files:**
- Modify: `index.html` (head: link `waitlist.css`; hero CTA group; final CTA section)

- [ ] **Step 1: Link `css/waitlist.css` in `<head>`**

In `index.html`, locate the existing stylesheet links (around line 30). After `<link rel="stylesheet" href="css/navbar.css" />`, add:

```html
<link rel="stylesheet" href="css/waitlist.css" />
```

- [ ] **Step 2: Replace hero CTA group with waitlist form**

In `index.html`, find the hero CTA group at approximately lines 541–547 (search for `cs-cta-group`):

```html
    <div class="cs-cta-group">
      <a href="mailto:hello@lyftora.in?subject=Early%20Access%20%E2%80%94%20Keep%20me%20posted&body=Hi%20Lyftora%20team%2C%0A%0APlease%20keep%20me%20updated%20on%20the%20launch.%0A%0AThanks!" class="cs-btn-primary">
        Get early access updates
        <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
      <span class="cs-email-note">Drop a mail at hello@lyftora.in &mdash; we reply to every one.</span>
    </div>
```

Replace with:

```html
    <div class="cs-cta-group">
      <div id="waitlist" class="waitlist">
        <form class="waitlist-form" novalidate>
          <input
            type="email"
            name="email"
            required
            placeholder="you@email.com"
            autocomplete="email"
            aria-label="Email address"
          />
          <button type="submit">Join waitlist <span aria-hidden="true">↗</span></button>
        </form>
        <p class="waitlist-status" role="status" aria-live="polite"></p>
        <p class="waitlist-microcopy">First 100 get one month free &middot; Early access for everyone</p>
      </div>
    </div>
```

- [ ] **Step 3: Replace final CTA section with waitlist form**

Find the final CTA at approximately lines 720–734:

```html
<section class="cs-final">
  <h2 class="cs-final-h2 reveal">Be first.<br/><em>Not left out.</em></h2>
  <p class="cs-final-sub reveal">
    We're building in public and keeping our early list small.
    Drop us an email — we'll tell you the moment Lyftora is ready to download.
  </p>
  <div class="cs-final-cta reveal">
    <a href="mailto:hello@lyftora.in?subject=Early%20Access%20%E2%80%94%20Keep%20me%20posted&body=Hi%20Lyftora%20team%2C%0A%0APlease%20keep%20me%20updated%20on%20the%20launch.%0A%0AThanks!" class="cs-btn-primary">
      hello@lyftora.in
      <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </a>
    <span class="cs-final-note">No spam. One email when we ship. That's it.</span>
  </div>
</section>
```

Replace with:

```html
<section class="cs-final">
  <h2 class="cs-final-h2 reveal">Be first.<br/><em>Not left out.</em></h2>
  <p class="cs-final-sub reveal">
    We're building in public and keeping our early list small.
    Drop your email — we'll tell you the moment Lyftora is ready to download.
  </p>
  <div class="cs-final-cta reveal">
    <div class="waitlist">
      <form class="waitlist-form" novalidate>
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          autocomplete="email"
          aria-label="Email address"
        />
        <button type="submit">Join waitlist <span aria-hidden="true">↗</span></button>
      </form>
      <p class="waitlist-status" role="status" aria-live="polite"></p>
      <p class="waitlist-microcopy">No spam. One email when we ship. That's it.</p>
    </div>
  </div>
</section>
```

The hero form has `id="waitlist"` (anchor target). The final CTA's wrapper omits the `id` to avoid duplicates but keeps the `waitlist-form` class so JS attaches to both via `querySelectorAll`.

- [ ] **Step 4: Verify**

```bash
grep -cn "waitlist-form" index.html
```

Expected: at least `2` (one in hero, one in final CTA).

```bash
grep -n "mailto:hello@lyftora" index.html
```

Expected: **no output** (the two mailto-CTA blocks are gone).

```bash
grep -n "id=\"waitlist\"" index.html
```

Expected: exactly one match.

- [ ] **Step 5: Manual browser check**

Open `index.html`. Confirm:
- Hero shows the email-input pill + "Join waitlist" button + microcopy line.
- Scrolling to the final section shows another email-input form.
- Submitting either does nothing yet (no handler) — that's Task 7.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat(index): replace mailto CTAs with canonical waitlist form"
```

---

### Task 6: Strip concrete ₹ figures from `index.html` ticker + "Why different"; update hero badge

**Files:**
- Modify: `index.html` (ticker items; cs-why first row; hero badge)

- [ ] **Step 1: Remove the ₹299 mention from the ticker**

In `index.html`, find the ticker (search for `cs-ticker-track`). It contains two copies of the same items. Replace **both** occurrences of:

```html
      <span class="cs-ticker-item">Plans from ₹299 · Cancel Anytime</span>
```

With:

```html
      <span class="cs-ticker-item">Cancel Anytime</span>
```

- [ ] **Step 2: Replace the ₹499 row in "Why different"**

Find the `cs-why` section (search for `Pay <em>once.</em>`). Replace the row body for "Pay once" — change:

```html
      <div class="cs-row reveal">
        <div class="cs-row-label">Pay <em>once.</em></div>
        <div class="cs-row-body">₹499 unlocks the entire app — forever, across every device. No locked tiers. No premium workouts. No upsell mid-set.</div>
        <div class="cs-row-tag">No subscription</div>
      </div>
```

To:

```html
      <div class="cs-row reveal">
        <div class="cs-row-label">Pay <em>once.</em></div>
        <div class="cs-row-body">One unlock for the entire app — forever, across every device. No locked tiers. No premium workouts. No upsell mid-set.</div>
        <div class="cs-row-tag">No subscription</div>
      </div>
```

- [ ] **Step 3: Update the hero badge**

Find the hero badge (search for `cs-badge-dot`):

```html
    <div class="cs-badge">
      <span class="cs-badge-dot" aria-hidden="true"></span>
      We're building something
    </div>
```

Replace the inner text:

```html
    <div class="cs-badge">
      <span class="cs-badge-dot" aria-hidden="true"></span>
      Pre-launch &middot; Coming soon
    </div>
```

- [ ] **Step 4: Verify**

```bash
grep -n "₹\|499\|Plans from" index.html
```

Expected: **no output** (no rupee-related literals in `index.html`).

```bash
grep -n "Pre-launch &middot; Coming soon\|Pre-launch · Coming soon" index.html
```

Expected: shows the badge line.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "content(index): strip concrete pricing references for pre-launch tone"
```

---

### Task 7: Add stub waitlist submit handler to `js/index.js`

**Files:**
- Modify: `js/index.js`

The handler attaches to all `.waitlist-form` elements, prevents default submission, and writes a placeholder success message. Phase 3 will replace the body of this handler with a real `fetch('/api/waitlist', ...)` call.

- [ ] **Step 1: Append the handler at end of `js/index.js`**

Append this IIFE to the bottom of `js/index.js`:

```javascript

/* ── Waitlist form stub (Phase 3 will wire to /api/waitlist + Resend) ── */
(() => {
  const forms = document.querySelectorAll('.waitlist-form');
  if (!forms.length) return;

  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = form.parentElement.querySelector('.waitlist-status');
      const email = form.querySelector('input[name="email"]').value.trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (status) {
          status.textContent = 'Please enter a valid email.';
          status.classList.remove('is-success');
          status.classList.add('is-error');
        }
        return;
      }

      console.info('[waitlist stub]', { email });
      if (status) {
        status.textContent = 'Thanks! We\'ll be in touch.';
        status.classList.remove('is-error');
        status.classList.add('is-success');
      }
      form.reset();
    });
  });
})();
```

- [ ] **Step 2: Verify**

```bash
grep -n "waitlist stub\|waitlist-form" js/index.js
```

Expected: shows the stub block.

- [ ] **Step 3: Manual browser check**

Open `index.html`. In each waitlist form:
- Submit empty → status shows "Please enter a valid email." in coral.
- Submit `not-an-email` → same error.
- Submit `test@example.com` → status shows "Thanks! We'll be in touch." in green; input clears; console shows `[waitlist stub] { email: 'test@example.com' }`.

- [ ] **Step 4: Commit**

```bash
git add js/index.js
git commit -m "feat(index): add stub waitlist submit handler (Phase 3 will wire to Resend)"
```

---

### Task 8: Add pre-launch banner to coach-ai + repoint final CTA's `pricing.html` link

**Files:**
- Modify: `lyftora-coach-ai.html` (head: link `waitlist.css`; body: add banner; final CTA href change)

- [ ] **Step 1: Link `css/waitlist.css` in `<head>`**

In `lyftora-coach-ai.html`, locate `<link rel="stylesheet" href="css/navbar.css"/>` (around line 86). After it, add:

```html
<link rel="stylesheet" href="css/waitlist.css"/>
```

- [ ] **Step 2: Add the pre-launch banner immediately after `<body>` opens**

Find the `<body>` tag in `lyftora-coach-ai.html`. Insert this block as the very first child of `<body>`:

```html
<aside class="prelaunch-banner" aria-label="Pre-launch announcement">
  <span>Lyftora is in pre-launch &middot; first 100 to join the waitlist get one month free</span>
  <a href="index.html#waitlist">Join waitlist &nbsp;&#8599;</a>
</aside>
```

The banner sits above the global navbar (which `js/navbar.js` injects at body start). Since the navbar JS uses `insertAdjacentElement('afterbegin', nav)`, it will end up above the banner — which is fine: navbar on top, banner below it. If you need banner on top instead, insert via JS after navbar mounts; keep it static for now.

- [ ] **Step 3: Repoint the final CTA from `pricing.html` to `index.html#waitlist`**

Find the final CTA (around line 653):

```html
          <a href="pricing.html" class="btn btn-secondary">Get Lyftora <span class="arc" aria-hidden="true">→</span></a>
```

Replace with:

```html
          <a href="index.html#waitlist" class="btn btn-secondary">Join waitlist <span class="arc" aria-hidden="true">→</span></a>
```

- [ ] **Step 4: Verify**

```bash
grep -n "pricing.html\|prelaunch-banner\|css/waitlist.css" lyftora-coach-ai.html
```

Expected: shows the `prelaunch-banner` line and the `waitlist.css` link; **no** `pricing.html` references.

- [ ] **Step 5: Manual browser check**

Open `lyftora-coach-ai.html`. Confirm:
- Pre-launch banner visible (dark, centered text + lime "Join waitlist ↗" link).
- Clicking the banner link navigates to `index.html#waitlist` and scrolls to the hero waitlist form.
- Final CTA at bottom now reads "Join waitlist" and routes to the same anchor.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add lyftora-coach-ai.html
git commit -m "feat(coach-ai): add pre-launch banner; repoint final CTA to waitlist anchor"
```

---

### Task 9: Replace coach-ai price-chart section with features-vs section (HTML)

**Files:**
- Modify: `lyftora-coach-ai.html` (replace `<section id="pricing-compare">` block)

- [ ] **Step 1: Locate and delete the entire `<section id="pricing-compare">`**

In `lyftora-coach-ai.html`, search for `id="pricing-compare"`. Delete the entire `<section>...</section>` block (currently lines 552–598). It contains the `.pchart-wrap`, `.pchart-side`, `.pchart-key`, and the inline SVG with the four lines and rupee labels.

- [ ] **Step 2: Insert the features-vs section in its place**

In the same position (between the SAFETY section and the FAQ section), insert:

```html
<!-- FEATURES COMPARISON (replaces price chart for pre-launch) -->
<section class="sec" id="vs" aria-label="How Lyftora compares">
  <div class="container">
    <div class="vs-wrap reveal">
      <div class="vs-head">
        <span class="kicker">—— Same problem. <em>Different approach.</em></span>
        <h3 style="margin-top:14px">Why we <em>built it.</em></h3>
        <p>Trainers, apps, and chatbots each solve a slice. Coach AI carries the whole room.</p>
      </div>
      <div class="vs-grid">
        <div class="vs-col">
          <h4 class="vs-col-h">Personal trainer</h4>
          <ul class="vs-list">
            <li><span class="vs-glyph">✓</span> Human, in the room</li>
            <li><span class="vs-glyph">—</span> Schedule-bound</li>
            <li><span class="vs-glyph">—</span> No medical baseline</li>
            <li><span class="vs-glyph">—</span> No math shown</li>
          </ul>
        </div>
        <div class="vs-col">
          <h4 class="vs-col-h">Other fitness apps</h4>
          <ul class="vs-list">
            <li><span class="vs-glyph">✓</span> Always available</li>
            <li><span class="vs-glyph">—</span> Generic plans</li>
            <li><span class="vs-glyph">—</span> No medical screening</li>
            <li><span class="vs-glyph">—</span> One template, every body</li>
          </ul>
        </div>
        <div class="vs-col">
          <h4 class="vs-col-h">Chatbot subscriptions</h4>
          <ul class="vs-list">
            <li><span class="vs-glyph">✓</span> Conversational</li>
            <li><span class="vs-glyph">—</span> Generates, doesn't calculate</li>
            <li><span class="vs-glyph">—</span> No refusals policy</li>
            <li><span class="vs-glyph">—</span> No follow-through</li>
          </ul>
        </div>
        <div class="vs-col vs-col-win">
          <h4 class="vs-col-h">Lyftora Coach AI</h4>
          <ul class="vs-list">
            <li><span class="vs-glyph">✓</span> Six experts in one</li>
            <li><span class="vs-glyph">✓</span> Medical screening required</li>
            <li><span class="vs-glyph">✓</span> Open math, every number</li>
            <li><span class="vs-glyph">✓</span> Refuses when it should</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Verify**

```bash
grep -n "pricing-compare\|pchart\|<svg viewBox=\"0 0 700 400\"" lyftora-coach-ai.html
```

Expected: **no output**.

```bash
grep -n "id=\"vs\"\|vs-grid\|vs-col-win" lyftora-coach-ai.html
```

Expected: shows the new section markers.

- [ ] **Step 4: Manual browser check**

Open `lyftora-coach-ai.html`. Confirm:
- Where the price chart was, now there's a 4-column grid of feature comparisons.
- The Lyftora column has dark background + lime accents.
- No rupee figures anywhere on the page.
- Reveal animation runs on scroll-into-view.

- [ ] **Step 5: Commit**

```bash
git add lyftora-coach-ai.html
git commit -m "feat(coach-ai): replace price chart with features comparison for pre-launch"
```

---

### Task 10: Update `css/coach-ai.css` — drop `.pchart-*` rules and FAQ white-bg + add `q-n` styles

**Files:**
- Modify: `css/coach-ai.css`

- [ ] **Step 1: Delete all `.pchart-*` related rules**

In `css/coach-ai.css`, locate the section under a `/* PRICE CHART */` or similar comment (search for `.pchart` in the file). Delete every rule that starts with one of:

- `.pchart`
- `.pchart-wrap`
- `.pchart-side`
- `.pchart-key`
- `.pchart svg`, `.pchart svg .gx`, `.pchart svg .ax`, `.pchart svg .annot`
- `.pchart .line`, `.line.l1`, `.line.l2`, `.line.l3`, `.line.lw`
- `.winner` (only if it's scoped to the price chart context — verify by reading surrounding rules)

Use grep to find the block boundaries:

```bash
grep -n "pchart\|\.line\.l[1-3w]\|\.winner" css/coach-ai.css
```

Delete the contiguous block of rules. Leave the rule's surrounding section comments to indicate this area was removed (or remove them too — either is fine).

- [ ] **Step 2: Remove the white-tinted `[open]` background on FAQ**

Find:

```css
.faq[open] { background: color-mix(in srgb, #fff 50%, transparent); }
```

Delete this rule entirely. (The summary text-color and icon-rotation rules for `[open]` remain; the visual cue is now: coral text + rotated icon, no fill.)

- [ ] **Step 3: Add the `Q · NN` meta-tag styles**

Find the existing `.faq summary` rule (around line 1397). After all the `.faq summary*` rules but before `.faq .a`, insert:

```css
.faq .q-n {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--muted);
  flex: 0 0 auto;
  align-self: flex-start;
  padding-top: 8px;
}
.faq[open] .q-n { color: var(--coral); }
.faq .q-t { flex: 1 1 auto; }
```

Also tighten the summary letter-spacing — find `.faq summary { ... letter-spacing: -.01em; ... }` and change it to `-.015em`.

- [ ] **Step 4: Strengthen the top rule on `.faqs`**

Find:

```css
.faqs { display: flex; flex-direction: column; gap: 0; border-top: 1px solid var(--line-strong); }
```

Change to:

```css
.faqs { display: flex; flex-direction: column; gap: 0; border-top: 2px solid var(--ink); }
```

- [ ] **Step 5: Verify**

```bash
grep -n "\.pchart\|\.line\.l\|\.winner" css/coach-ai.css
```

Expected: **no output** (price-chart rules gone). If the `.winner` selector was used outside the price-chart context, leave it; revisit case-by-case.

```bash
grep -n "\.faq \.q-n\|2px solid var(--ink)" css/coach-ai.css
```

Expected: shows the new q-n rule and the strengthened top rule.

- [ ] **Step 6: Commit**

```bash
git add css/coach-ai.css
git commit -m "refactor(css): drop price-chart styles; add FAQ q-n meta + newspaper rule"
```

---

### Task 11: Add `Q · 01` … `Q · 06` meta tags to FAQ summaries in `lyftora-coach-ai.html`

**Files:**
- Modify: `lyftora-coach-ai.html` (six `<summary>` elements in the FAQ section)

- [ ] **Step 1: Wrap each summary's text in a `<span class="q-t">` and add a `<span class="q-n">` prefix**

The FAQ has six `<details class="faq">` elements (lines ~609–632). For each, transform:

```html
        <details class="faq" [open]>
          <summary>Is Coach AI a real trainer or a chatbot?<span class="icn" aria-hidden="true">+</span></summary>
          <div class="a">…</div>
        </details>
```

Into:

```html
        <details class="faq" [open]>
          <summary>
            <span class="q-n">Q · 01</span>
            <span class="q-t">Is Coach AI a real trainer or a chatbot?</span>
            <span class="icn" aria-hidden="true">+</span>
          </summary>
          <div class="a">…</div>
        </details>
```

Apply this transformation to all six in order, with `Q · 01` through `Q · 06`. The first FAQ keeps its `open` attribute; the rest stay closed.

The exact mapping by current question text (in document order):

| Current summary text | Numbering |
|---|---|
| Is Coach AI a real trainer or a chatbot? | Q · 01 |
| What if I have a medical condition? | Q · 02 |
| Does it know Indian and regional foods? | Q · 03 |
| Can it adapt my existing diet plan? | Q · 04 |
| What about pregnancy or postpartum? | Q · 05 |
| Does it work without internet? | Q · 06 |

- [ ] **Step 2: Verify**

```bash
grep -c "class=\"q-n\"" lyftora-coach-ai.html
```

Expected: `6`.

```bash
grep -c "class=\"q-t\"" lyftora-coach-ai.html
```

Expected: `6`.

- [ ] **Step 3: Manual browser check**

Open `lyftora-coach-ai.html`, scroll to FAQ. Confirm:
- Each summary shows a small mono `Q · 01` … `Q · 06` left of the question text.
- First FAQ is open by default. Open meta-tag is coral (other FAQs' meta-tags are muted).
- Background of open FAQ is **not** white/cream-tinted — it matches the page surface.
- The `+` icon still rotates 45° on open.

- [ ] **Step 4: Commit**

```bash
git add lyftora-coach-ai.html
git commit -m "feat(coach-ai): add Q · NN meta tags to FAQ summaries"
```

---

### Task 12: Fix FAQ animation in `js/coach-ai.js` (eliminate flicker)

**Files:**
- Modify: `js/coach-ai.js:244-304`

The current code does `faq.setAttribute('open', '')` *before* starting the animation. The browser instantly expands the `<details>` element to full content height; the JS height interpolation then starts from 0 — that race causes the visible flicker. Fix: pin the `.a` element to `height: 0; overflow: hidden` *before* setting `open`, force a reflow, then animate.

- [ ] **Step 1: Replace the `openPanel` function**

In `js/coach-ai.js`, find the existing `openPanel`:

```javascript
  function openPanel(faq) {
    const content = faq.querySelector('.a');
    if (!content) return;

    faq.setAttribute('open', '');
    const h = content.scrollHeight;

    content.animate(
      [{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }],
      { duration: DURATION_OPEN, easing: EASING, fill: 'forwards' }
    ).finished.then(() => {
      content.style.height = '';
      content.style.opacity = '';
    });
  }
```

Replace with:

```javascript
  function openPanel(faq) {
    const content = faq.querySelector('.a');
    if (!content) return;

    if (reduced) { faq.setAttribute('open', ''); return; }

    // Pin to zero before native expand to avoid the flicker race
    content.style.overflow = 'hidden';
    content.style.height = '0px';
    content.style.opacity = '0';
    faq.setAttribute('open', '');

    // Force reflow so the next animation has a clean starting state
    void content.offsetHeight;

    const target = content.scrollHeight;
    content.animate(
      [{ height: '0px', opacity: 0 }, { height: target + 'px', opacity: 1 }],
      { duration: DURATION_OPEN, easing: EASING, fill: 'forwards' }
    ).finished.then(() => {
      content.style.overflow = '';
      content.style.height = '';
      content.style.opacity = '';
    });
  }
```

- [ ] **Step 2: Replace the `closePanel` function**

Find:

```javascript
  function closePanel(faq) {
    const content = faq.querySelector('.a');
    if (!content) return;

    const h = content.getBoundingClientRect().height;

    content.animate(
      [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: DURATION_CLOSE, easing: EASING, fill: 'forwards' }
    ).finished.then(() => {
      faq.removeAttribute('open');
      content.style.height = '';
      content.style.opacity = '';
    });
  }
```

Replace with:

```javascript
  function closePanel(faq) {
    const content = faq.querySelector('.a');
    if (!content) return;

    if (reduced) { faq.removeAttribute('open'); return; }

    const h = content.getBoundingClientRect().height;
    content.style.overflow = 'hidden';
    content.style.height = h + 'px';
    void content.offsetHeight;

    content.animate(
      [{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: DURATION_CLOSE, easing: EASING, fill: 'forwards' }
    ).finished.then(() => {
      faq.removeAttribute('open');
      content.style.overflow = '';
      content.style.height = '';
      content.style.opacity = '';
    });
  }
```

- [ ] **Step 3: Verify**

```bash
grep -n "void content.offsetHeight" js/coach-ai.js
```

Expected: 2 matches (one in `openPanel`, one in `closePanel`).

- [ ] **Step 4: Manual browser check**

Open `lyftora-coach-ai.html`. Click each FAQ open/closed multiple times. Confirm:
- No visible flicker or "pop" on open — content slides down smoothly from 0 height.
- Close also slides smoothly.
- Rapid clicking doesn't leave a panel stuck half-open.
- With OS reduced-motion enabled, panels open/close instantly with no animation.

- [ ] **Step 5: Commit**

```bash
git add js/coach-ai.js
git commit -m "fix(coach-ai): eliminate FAQ open/close animation flicker"
```

---

### Task 13: Final cross-page verification

**Files:** none (read-only).

- [ ] **Step 1: Audit for leftover pricing references**

```bash
grep -rn "pricing.html\|Get Lyftora\|Plans from ₹\|₹499\|₹299" \
  index.html lyftora-coach-ai.html pricing.html sitemap.xml \
  js/navbar.js js/footer.js js/index.js js/coach-ai.js \
  css/*.css 2>/dev/null
```

Expected: **no output** — every concrete pricing string and every link to `pricing.html` is gone from the public surface. (`pricing.html` itself is allowed to keep its own content — only links/references *into* it are gone.)

- [ ] **Step 2: Audit waitlist anchor reachability**

```bash
grep -rn "index.html#waitlist" js/*.js *.html | wc -l
```

Expected: at least `4` (navbar CTA + drawer CTA + coach-ai banner link + coach-ai final CTA).

- [ ] **Step 3: Audit FAQ markup**

```bash
grep -c "class=\"q-n\"" lyftora-coach-ai.html
```

Expected: `6`.

- [ ] **Step 4: Open all three pages and run the visual checklist**

| Page | Navbar | Banner | Footer | Forms work | Console clean |
|---|---|---|---|---|---|
| `index.html` | Home / Coach AI / Join waitlist | none | shared (no Pricing in Product col, "Pre-launch · Coming soon") | hero + final waitlist accept emails, show success | yes |
| `lyftora-coach-ai.html` | Home / Coach AI / Join waitlist | dark pre-launch banner with lime CTA | shared | clicking final CTA goes to `index.html#waitlist` | yes |
| `pricing.html` | Home / Coach AI / Join waitlist | none | shared | n/a | yes |

If any cell fails, stop and debug before declaring done.

- [ ] **Step 5: View-source check on `pricing.html`**

```bash
grep -n "noindex" pricing.html
```

Expected: shows the meta line.

- [ ] **Step 6: Final commit (if anything tweaked)**

If verification surfaced no changes, skip. Otherwise:

```bash
git add -A
git commit -m "fix: post-verification adjustments to pre-launch rollout"
```

---

## Notes for the Engineer

- **Cascade order:** `css/waitlist.css` is linked AFTER each page's primary stylesheet. Don't reorder it.
- **No backend yet.** Form submissions just show a stub success message and log to console. Phase 3 will add `/api/waitlist` (Cloudflare Pages Function) calling Resend.
- **Privacy page:** out of scope here — leave `privacy.html` and its sitemap entry alone.
- **If you find footer styles missing** on a page after these edits, that's a Phase 1 leftover (CSS-extraction unfinished). Treat it as a separate fix; don't bundle here.
- **Reduced-motion:** the FAQ animation fix preserves the existing reduced-motion guard via the `reduced` variable already defined in the IIFE scope.
