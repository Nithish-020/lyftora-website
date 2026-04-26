# Pre-launch Content Rewrite — Design

**Date:** 2026-04-26
**Status:** Approved
**Depends on:** [2026-04-25-shared-header-footer-design.md](2026-04-25-shared-header-footer-design.md) (Phase 1)
**Followed by:** Phase 3 — Resend waitlist backend (separate spec, TBD)

## Problem

Lyftora is pre-launch but the site reads as if shipped. Pricing page is exposed in nav, CTAs say "Get Lyftora", and there's no waitlist capture anywhere. We need to (a) reduce the site surface to two pages (`index.html`, `lyftora-coach-ai.html`), (b) rewrite copy for pre-launch tone, and (c) add an email-only waitlist form anchor that Phase 3 will wire to Resend.

## Inputs locked

- Pages live in nav: `index.html`, `lyftora-coach-ai.html`. `pricing.html` is hidden, not deleted.
- Voice: existing punchy editorial fitness tone, preserved.
- Hook: "Coming soon" (no date) + "First 100 get one month free" + "Early access for everyone."
- Form: email-only.
- All CTAs across both pages route to `#waitlist` on `index.html`.

## Changes

### `js/navbar.js`
- `PAGES` array → `[Home, Coach AI]` (drop Pricing entry).
- `CTA_HREF` → `'index.html#waitlist'`. `CTA_LABEL` → `'Join waitlist'`.
- `detectActivePage` — remove the pricing branch.

### `js/footer.js` (new in Phase 1)
- Product column: `Features` / `FAQ` only (drop Pricing).
- Bottom-right meta: replace `"v1.0 · Shipping May 29"` with `"Pre-launch · Coming soon"`.

### `index.html` — trimmed pre-launch structure

Sections, in order:

1. **Hero**
   - Eyebrow: `PRE-LAUNCH · COMING SOON`
   - Headline (new copy, voice-matched, e.g. *"The coach who shows up before you do."*) — final wording in implementation.
   - 1-line sub-headline (rewrite of current "doesn't charge rent" line).
   - Inline waitlist form (markup below) with `id="waitlist"` anchor on its wrapper.
   - Micro-copy under form: *"First 100 get one month free. Early access for everyone."*
2. **What it is** — 3-card grid, one line each: *Six experts in one.* / *Trained on real medical screening.* / *Doesn't charge rent.*
3. **Who it's for** — two short blocks: "For people who train for life." / "Not for people chasing promo codes."
4. **Sample expert teaser** — pulls one of the six (Sports medicine) with a teaser line and a link "See all six experts → " to `lyftora-coach-ai.html`.
5. **Final CTA** — repeats the waitlist form + "First 100" line + a quiet *"We'll only email you about the launch."*

Sections deleted from current `index.html`: detailed features list, FAQ block, anything pricing-adjacent. Removed cleanly — not commented out. Git history preserves the original.

### `lyftora-coach-ai.html` — keep intact + waitlist banner
- New full-width banner directly under the global navbar: low-contrast background, copy *"Lyftora is in pre-launch. First 100 to join the waitlist get one month free."*, with `Join waitlist →` button linking to `index.html#waitlist`.
- All existing CTAs labeled "Get Lyftora" or pointing to `pricing.html` → relabel `Join waitlist`, repoint to `index.html#waitlist`.
- Inline `<header class="bar">` removal is owned by Phase 1; this spec only touches the body content + CTAs + banner.
- Deep content (six experts, calculator, safety, FAQ) preserved as-is.

### `pricing.html`
- Add `<meta name="robots" content="noindex">` in `<head>`.
- File remains in repo (resurrected in a future post-launch phase).

### `sitemap.xml`
- Remove the `pricing.html` entry.

### `js/index.js`
- Remove any code referencing deleted sections (FAQ accordion, etc.) — to be inventoried during plan/implementation.
- Add a stub waitlist submit handler that calls `event.preventDefault()` and logs to `console.info` only. Phase 3 replaces this stub.

### Form markup (canonical — used in hero and final CTA)

```html
<div id="waitlist" class="waitlist">
  <form id="waitlist-form" class="waitlist-form" novalidate>
    <input
      type="email"
      name="email"
      required
      placeholder="you@email.com"
      autocomplete="email"
      aria-label="Email address"
    />
    <button type="submit">Join waitlist <span aria-hidden="true">↗</span></button>
    <p class="waitlist-status" role="status" aria-live="polite"></p>
  </form>
</div>
```

The hero form gets `id="waitlist"` on its wrapper (the anchor target). The final-CTA form omits the `id` to avoid duplicates but keeps the `waitlist-form` class so the Phase 3 handler attaches to both via `querySelectorAll`.

### `css/waitlist.css` (new)
- Form layout (input + button row, mobile stacks).
- `.waitlist-status` text states (idle hidden, success, error).
- Coach-AI top banner styles.
- Linked from both `index.html` and `lyftora-coach-ai.html`.

## Out of scope (Phase 3)

- Cloudflare Pages Function `/api/waitlist`.
- Resend Audience integration.
- Real success/error UX in `.waitlist-status`.
- Rate limiting, anti-bot, server-side email validation.
- Confirmation emails.

## Verification

- Nav shows Home + Coach AI + "Join waitlist" CTA. No Pricing link anywhere visible.
- `pricing.html` returns content but `<meta robots="noindex">` is present and sitemap omits it.
- `index.html` is the trimmed 5-section structure; clicking "Join waitlist" anywhere scrolls to `#waitlist`.
- Coach-AI shows the pre-launch banner, all CTAs route to `index.html#waitlist`.
- Submitting the form does nothing visible (stub) but does not navigate or error.
- Footer reads "Pre-launch · Coming soon"; Product column is Features / FAQ only.
