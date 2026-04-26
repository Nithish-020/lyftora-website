# Shared Header & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace duplicated/conflicting inline header and footer markup across the three HTML pages with a single JS-injected shared header (already exists) and footer.

**Architecture:** Mirror the existing `js/navbar.js` IIFE pattern with a new `js/footer.js`. Extract footer CSS from `css/index.css` into `css/footer.css`. Edit each HTML page to remove inline header/footer and link the new assets.

**Tech Stack:** Vanilla HTML/CSS/JS. No framework, no build step. Static site on Cloudflare Pages.

**Spec:** [docs/superpowers/specs/2026-04-25-shared-header-footer-design.md](../specs/2026-04-25-shared-header-footer-design.md)

**Verification model:** This is a static site with no test runner. "Tests" in this plan = manual browser verification with explicit before/after assertions. Each task ends with a verification step that the engineer must perform with their eyes open.

---

## File Structure

| File | Purpose | New / Modified |
|---|---|---|
| `css/footer.css` | All shared footer styles | New |
| `js/footer.js` | Injects canonical footer into `<body>` | New |
| `css/index.css` | Footer block removed (now in footer.css) | Modified |
| `index.html` | Inline `<footer>` deleted; link footer.css + footer.js | Modified |
| `pricing.html` | Inline `<footer>` deleted; link footer.css + footer.js | Modified |
| `lyftora-coach-ai.html` | Inline `<header class="bar">` AND `<footer>` deleted; link footer.css + footer.js | Modified |

---

### Task 1: Create `css/footer.css` by extracting footer rules from `css/index.css`

**Files:**
- Create: `css/footer.css`
- Modify: `css/index.css` (delete extracted block)

- [ ] **Step 1: Create `css/footer.css` with the extracted styles**

Write the file with exactly this content (verbatim copy of `index.css:2041-2105`):

```css
/* ---------- Footer ---------- */
footer {
  padding: 60px 0 40px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;
  padding-bottom: 40px;
  border-bottom: 1px solid color-mix(in srgb, var(--ink) 15%, transparent);
}

@media (min-width: 760px) {
  .footer-grid {
    grid-template-columns: 2fr 1fr 1fr 1fr;
  }
}

.foot-brand-big {
  font-family: var(--serif);
  font-size: clamp(60px, 10vw, 140px);
  line-height: 0.9;
  letter-spacing: -0.03em;
}

.foot-col h4 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--muted);
  margin-bottom: 14px;
}

.foot-col ul li {
  padding: 6px 0;
}

.foot-col ul li a {
  font-size: 15px;
  transition: color .2s;
}

.foot-col ul li a:hover {
  color: var(--coral);
}

.foot-bottom {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

@media (min-width: 760px) {
  .foot-bottom {
    flex-direction: row;
    align-items: center;
  }
}
```

Note: this CSS uses `var(--serif)`, `var(--mono)`, `var(--muted)`, `var(--ink)`, `var(--coral)` — all defined in `css/tokens.css`. Every page already links `tokens.css` indirectly via its main stylesheet, but verify in Task 4–6 that each page links `footer.css` AFTER the page's primary stylesheet so cascade order is preserved.

- [ ] **Step 2: Delete the extracted block from `css/index.css`**

Open `css/index.css`. Delete lines that begin at the comment `/* ---------- Footer ---------- */` and end immediately before `/* ---------- Confetti ---------- */`. That is the block from line 2041 through (and including) the blank line at 2106. Leave `Confetti` block intact.

- [ ] **Step 3: Verify**

Run from project root:

```bash
grep -n "^footer\b\|\.footer-grid\|\.foot-brand-big\|\.foot-bottom\|\.foot-col" css/index.css
```

Expected: **no output** (the rules are gone from index.css).

```bash
grep -n "^footer\b\|\.footer-grid" css/footer.css
```

Expected: at least the `footer {` and `.footer-grid {` lines present.

- [ ] **Step 4: Commit**

```bash
git add css/footer.css css/index.css
git commit -m "refactor(css): extract footer styles into css/footer.css"
```

---

### Task 2: Create `js/footer.js` to inject the canonical footer

**Files:**
- Create: `js/footer.js`

- [ ] **Step 1: Create `js/footer.js` with the IIFE injector**

Write the file with exactly this content. The pattern mirrors `js/navbar.js`. Markup is the index.html footer, lifted verbatim except the brand `<div>` becomes the canonical block (no `id`s).

```javascript
/**
 * Lyftora — Shared Site Footer
 *
 * Injects a shared footer at the end of <body>.
 * Markup mirrors index.html's original footer (4-column).
 * Styles live in css/footer.css.
 */
(function () {
  'use strict';

  function init() {
    if (document.querySelector('footer.site-footer')) return;

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container">
        <div class="foot-brand-big">Lyftora<span style="color:var(--coral)">.</span></div>
        <div class="footer-grid" style="margin-top:40px">
          <div>
            <p style="max-width: 34ch; font-size: 15px; color: var(--muted);">
              The AI personal trainer that doesn't charge rent. Built for people who train for life, not for a promo code.
            </p>
          </div>
          <div class="foot-col">
            <h4>Product</h4>
            <ul>
              <li><a href="index.html#features">Features</a></li>
              <li><a href="pricing.html">Pricing</a></li>
              <li><a href="index.html#faq">FAQ</a></li>
            </ul>
          </div>
          <div class="foot-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">Manifesto</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
          <div class="foot-col">
            <h4>Follow</h4>
            <ul>
              <li><a href="#">Instagram</a></li>
              <li><a href="#">YouTube</a></li>
              <li><a href="#">X / Twitter</a></li>
            </ul>
          </div>
        </div>
        <div class="foot-bottom">
          <div>&copy; 2026 Lyftora &middot; Made with care.</div>
          <div>v1.0 &middot; Shipping May 29</div>
        </div>
      </div>
    `;

    document.body.appendChild(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

Note: The Pricing link, "v1.0 · Shipping May 29", and `#features`/`#faq` anchors stay for now — Phase 2 changes those.

The `.site-footer` class is just a uniqueness marker for the idempotency check; styles still target `footer { ... }` from `footer.css`.

- [ ] **Step 2: Verify file created**

```bash
test -f js/footer.js && echo OK
```

Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add js/footer.js
git commit -m "feat(js): add shared footer injector js/footer.js"
```

---

### Task 3: Wire `js/footer.js` and `css/footer.css` into `index.html`; remove inline footer

**Files:**
- Modify: `index.html` (head: add stylesheet link; body: delete inline `<footer>`; pre-`</body>`: add script tag)

- [ ] **Step 1: Add the footer stylesheet link in `<head>`**

In `index.html`, locate the line:

```html
<link rel="stylesheet" href="css/navbar.css" />
```

Add immediately after it:

```html
<link rel="stylesheet" href="css/footer.css" />
```

- [ ] **Step 2: Delete the inline footer block (lines 545–584)**

Locate and delete the entire block starting at `<footer>` (line 545) through `</footer>` (line 584). Leave the surrounding markup intact. The deleted block looks like:

```html
<footer>
  <div class="container">
    <div class="foot-brand-big">Lyftora<span style="color:var(--coral)">.</span></div>
    ...
    <div class="foot-bottom">
      <div>&copy; 2026 Lyftora &middot; Made with care.</div>
      <div>v1.0 &middot; Shipping May 29</div>
    </div>
  </div>
</footer>
```

- [ ] **Step 3: Add the footer script tag near `navbar.js`**

Find the line:

```html
<script src="js/navbar.js" defer></script>
```

Add immediately after it:

```html
<script src="js/footer.js" defer></script>
```

- [ ] **Step 4: Verify**

```bash
grep -n "<footer\|css/footer.css\|js/footer.js" index.html
```

Expected output: shows the `css/footer.css` link line, the `js/footer.js` script line, and **no** `<footer>` opening tag (no inline footer).

- [ ] **Step 5: Manual browser check**

Open `index.html` in a browser (file:// is fine — `navbar.js` already runs that way). Confirm:
- One navbar at top.
- One 4-column footer at bottom matching the previous design (large "Lyftora." word, Product/Company/Follow columns, "© 2026 Lyftora…" bottom row).
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "refactor(index): use shared footer.js/footer.css; drop inline footer"
```

---

### Task 4: Wire shared footer into `pricing.html`; remove inline footer

**Files:**
- Modify: `pricing.html`

- [ ] **Step 1: Add the footer stylesheet link in `<head>`**

In `pricing.html`, find:

```html
<link rel="stylesheet" href="css/navbar.css" />
```

Add immediately after it:

```html
<link rel="stylesheet" href="css/footer.css" />
```

- [ ] **Step 2: Delete the inline footer block (lines 327–335)**

Delete the entire block:

```html
<footer>
  <div class="container">
    <div class="foot-word">Lyft<em>ora.</em></div>
    <div class="foot-row">
      <span>&copy; 2026 Lyftora &middot; Built for the next rep.</span>
      <span>pricing &middot; v2</span>
    </div>
  </div>
</footer>
```

The previous minimal one-liner pricing footer is gone (per spec — canonical footer wins).

- [ ] **Step 3: Add the footer script tag**

Find:

```html
<script src="js/navbar.js" defer></script>
```

Add immediately after it:

```html
<script src="js/footer.js" defer></script>
```

- [ ] **Step 4: Verify**

```bash
grep -n "<footer\|foot-word\|foot-row\|css/footer.css\|js/footer.js" pricing.html
```

Expected: shows `footer.css` and `footer.js` lines; no `<footer>`, `foot-word`, or `foot-row` lines.

- [ ] **Step 5: Manual browser check**

Open `pricing.html`. Confirm:
- One navbar at top.
- 4-column shared footer at bottom (same as index now).
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add pricing.html
git commit -m "refactor(pricing): use shared footer; drop inline minimal footer"
```

---

### Task 5: Wire shared footer into `lyftora-coach-ai.html`; remove inline `<header class="bar">` AND inline footer

**Files:**
- Modify: `lyftora-coach-ai.html`

This is the task that actually fixes the original bug (stacked navs).

- [ ] **Step 1: Add the footer stylesheet link in `<head>`**

In `lyftora-coach-ai.html`, find:

```html
<link rel="stylesheet" href="css/navbar.css"/>
```

Add immediately after it:

```html
<link rel="stylesheet" href="css/footer.css"/>
```

- [ ] **Step 2: Delete the inline `<header class="bar">` block (lines 92–107)**

Delete the entire block:

```html
<header class="bar" aria-label="Site header">
  <a href="#top" class="brand" aria-label="Lyftora Coach AI home">
    <span class="dot" aria-hidden="true"></span>
    <span class="word">Lyftora</span>
    <span class="stamp">COACH AI</span>
  </a>
  <nav aria-label="Primary">
    <a href="#experts">Experts</a>
    <a href="#how">How</a>
    <a href="#features">Features</a>
    <a href="#calc">Calculator</a>
    <a href="#safety">Safety</a>
    <a href="#faq">FAQ</a>
  </nav>
  <a href="#get" class="cta">Get Lyftora <span aria-hidden="true">↗</span></a>
</header>
```

The line `<main id="top">` should immediately follow the closing `</nav>` of any preceding script/link, OR the start of `<body>`. Verify after the edit that nothing references the deleted header — specifically that no CSS rule targets `header.bar` exclusively for layout collapse (visual check in Step 6).

- [ ] **Step 3: Delete the inline footer block (lines 676–721)**

Delete the entire block starting at `<footer aria-label="Site footer">` and ending at `</footer>`. The Coach-AI-specific footer (Coach AI / Get the app columns, mailto, sitemap link, etc.) is gone — replaced by the canonical shared footer.

- [ ] **Step 4: Add the footer script tag**

Find:

```html
<script src="js/navbar.js" defer></script>
```

Add immediately after it:

```html
<script src="js/footer.js" defer></script>
```

- [ ] **Step 5: Verify**

```bash
grep -n "<header class=\"bar\"\|<footer\|css/footer.css\|js/footer.js\|aria-label=\"Site footer\"" lyftora-coach-ai.html
```

Expected: shows `footer.css` and `footer.js` lines; no `<header class="bar"`, no `<footer`, no `aria-label="Site footer"` lines.

- [ ] **Step 6: Manual browser check (most important)**

Open `lyftora-coach-ai.html`. Confirm:
- **Exactly one** navbar at the top — no stacked headers (this is the bug fix).
- 4-column shared footer at bottom (matches index/pricing).
- The `id="top"` anchor still resolves (Coach-AI brand link inside the global navbar's mobile drawer should scroll to top of `<main>`).
- No console errors.
- The in-page step rail at line 216 (`manu-rail`) still renders and works (it is unrelated to the deleted header).

- [ ] **Step 7: Commit**

```bash
git add lyftora-coach-ai.html
git commit -m "refactor(coach-ai): use shared header/footer; drop duplicate inline header"
```

---

### Task 6: Final cross-page verification

**Files:** none (read-only checks)

- [ ] **Step 1: Run the full grep audit**

```bash
grep -rn "<footer\b" index.html pricing.html lyftora-coach-ai.html
```

Expected: **no output** (no inline `<footer>` left on any page).

```bash
grep -rn "<header class=\"bar\"" lyftora-coach-ai.html
```

Expected: **no output**.

```bash
grep -n "js/footer.js\|css/footer.css" index.html pricing.html lyftora-coach-ai.html | wc -l
```

Expected: `6` (each of the 3 files has exactly 2 references — one CSS link and one JS script).

- [ ] **Step 2: Open all three pages in the browser, side-by-side**

Visual checklist for each page:

| | navbar count | footer count | console errors | drawer opens on burger |
|---|---|---|---|---|
| index.html | 1 | 1 | 0 | yes |
| pricing.html | 1 | 1 | 0 | yes |
| lyftora-coach-ai.html | 1 | 1 | 0 | yes |

If any cell fails, stop and debug before claiming completion.

- [ ] **Step 3: Final commit (if anything was tweaked during verification)**

If verification surfaced no changes, skip. Otherwise:

```bash
git add -A
git commit -m "fix: post-verification adjustments to shared header/footer rollout"
```

---

## Notes for the Engineer

- **Cascade order matters.** `footer.css` must be linked AFTER each page's primary stylesheet, so any future page-specific overrides win. Tasks 3–5 explicitly place it after the existing main stylesheet links — keep that order.
- **Don't delete `pricing.html`'s minimal footer markup early.** Order of operations in Task 4 matters: add the script tag first only if you want both visible briefly during edit; otherwise just follow the steps in order and accept a few seconds of "no footer."
- **No build step.** Files are served as-is by Cloudflare Pages. Test locally by opening files directly in a browser (`file://`) — `navbar.js` and `footer.js` use only DOM APIs and work over `file://`.
- **If footer styling looks off on pricing or coach-ai**, the most likely cause is that `footer.css` was linked before the page's primary stylesheet. Check `<head>` order.
