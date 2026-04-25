# Shared Header & Footer — Design

**Date:** 2026-04-25
**Status:** Approved

## Problem

`lyftora-coach-ai.html` renders two stacked headers: the global navbar injected by `js/navbar.js` plus an inline `<header class="bar">` hardcoded at lines 92–107. Footers diverge across all three pages — `index.html` (4-col), `pricing.html` (one-line), `lyftora-coach-ai.html` (4-col, different content).

Goal: a single canonical header and footer used on every HTML page, edited in one place.

## Approach

Extend the existing JS-injection pattern already used by `js/navbar.js`. No `fetch()`, no HTML partials, no build step.

- Header: keep `js/navbar.js` as-is (already canonical).
- Footer: add `js/footer.js` mirroring the navbar pattern; inject the index-style 4-column footer at end of body.
- Extract footer CSS from `css/index.css` into `css/footer.css` so the injected markup styles correctly on every page.

## Canonical content

- **Header:** the global nav rendered by `js/navbar.js` (Home / Coach AI / Pricing + CTA + mobile drawer).
- **Footer:** the `index.html` 4-column layout — tagline / Product / Company / Follow / bottom row (`© 2026 Lyftora · Made with care.` + `v1.0 · Shipping May 29`).

## Changes

### New files

- `js/footer.js` — IIFE that builds a `<footer>` with the canonical markup and appends it to `<body>`. Same defensive style as `navbar.js` (DOMContentLoaded check, no dependencies).
- `css/footer.css` — contains `footer`, `.footer-grid`, `.foot-brand-big`, `.foot-col`, `.foot-bottom` rules moved from `index.css`.

### Modified files

- `css/index.css` — remove the footer rules (now in `footer.css`).
- `index.html` — link `css/footer.css`; delete inline `<footer>` (lines 545–584); add `<script src="js/footer.js" defer>`.
- `pricing.html` — link `css/footer.css`; delete inline `<footer>` (lines 327–335); add footer.js script.
- `lyftora-coach-ai.html` — link `css/footer.css`; **delete inline `<header class="bar">` (lines 92–107)** (fixes stacked-nav bug); delete inline `<footer>` (lines 676–721); add footer.js script.

## Decisions accepted

1. Canonical footer = the index 4-column footer.
2. Coach-AI's page-internal anchor nav (Experts / How / Features / Calculator / Safety / FAQ) is dropped entirely. Readers reach those sections by scrolling or via the existing step rail at line 216.
3. Coach-AI footer's extra links (mailto, App Store, Play Store, Privacy, Terms, Sitemap) are NOT preserved — user accepted the loss.

## Out of scope

- No build tooling.
- No HTML partial files / `fetch()` loader.
- No changes to navbar markup or behavior.
- No new pages.

## Verification

After change, on each of `index.html`, `pricing.html`, `lyftora-coach-ai.html`:

- Exactly one navbar at top of body.
- Exactly one footer at end of body, matching the index 4-column design.
- Active page link in navbar reflects the current page.
- No console errors.
- coach-ai page no longer shows the duplicate hardcoded header.
