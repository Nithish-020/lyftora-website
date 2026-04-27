# Waitlist Pipeline + Lighthouse Audit Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub waitlist with a real Supabase + Resend submission pipeline via a Cloudflare Pages Function, then fix every Lighthouse accessibility/SEO/caching issue flagged in the audit spec.

**Architecture:** A zero-build static site on Cloudflare Pages. Server logic lives exclusively in `functions/api/waitlist.js` (Cloudflare Pages Function). Supabase is called directly via its REST API; Resend via its email API. No npm, no build step. Frontend JS replaces the stub `fetch` body with full error-branch handling.

**Tech Stack:** Vanilla HTML/CSS/JS · Cloudflare Pages Functions (ES modules) · Supabase REST API · Resend Email API · Cloudflare KV (rate limiting) · `crypto.subtle` (SHA-256 hashing)

---

## Conflicts / Pre-flight notes

1. `functions/api/waitlist.js` **already exists** but only sends an owner-notification email — it has no Supabase insert, no IP rate-limiting, no KV binding, and CORS is `*` not `https://lyftora.in`. It will be replaced wholesale.
2. `js/index.js` **already has** the advanced waitlist handler (loading spinner, `showSuccess` with a card, aria-busy, etc.) — it is NOT the stub described in the spec. The existing JS is already correct; only the Function needs rewriting.
3. `robots.txt` already has `Content-Signal` **removed** (current file is the clean three-line version). No action needed.
4. `pricing.html` already has `<meta name="robots" content="noindex, nofollow" />`. No action needed.
5. The existing `_headers` file is missing `/css/*`, `/js/*`, `Content-Signal`, and `interest-cohort` in Permissions-Policy. It needs expansion.
6. Footer `<h4>` headings are in `js/footer.js` (dynamically injected), not in `index.html`. CSS selector is `.foot-col h4`. Fix: change the three `<h4>` tags in `footer.js` to `<h3>` and update the CSS selector accordingly.
7. No skip link exists. `<body>` opens directly into `<div class="cs-wrap">` then `<section class="cs-hero">` — no `<main>` wrapper. Must be added.
8. No JSON-LD in `<head>`. No `assets/icons/` directory — logo is at `assets/images/lyftora-preview-thumbnail.png`. Use that path (or omit logo from JSON-LD entirely since it's a preview thumbnail, not a square logo — safer to omit until a real logo file exists).
9. `lyftora-coach-ai.html.bak` exists in repo root. Must be deleted.
10. Footer dead links: `Manifesto`, `Careers`, `Press` all `href="#"`. `FAQ` links to `index.html#faq`. Social links (`Instagram`, `YouTube`, `X / Twitter`) all `href="#"`. Per spec: either point to real anchors or remove. Remove the three social dead `<a href="#">` links entirely (they exist in Follow column). For Manifesto/Careers/Press: remove them. Keep FAQ pointing to `#faq` anchor (check it exists), keep email links, keep Privacy.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `functions/api/waitlist.js` | **Rewrite** | Full waitlist endpoint: CORS, rate-limit via KV, Supabase insert, Resend confirmation email |
| `db/migrations/0001_waitlist.sql` | **Create** | Supabase schema with citext, RLS, index |
| `_headers` | **Update** | Add `/css/*`, `/js/*`, `Content-Signal`, `interest-cohort`, `/api/*` no-store |
| `js/footer.js` | **Update** | Change `<h4>` → `<h3>` for Product/Company/Follow; remove dead `href="#"` links |
| `css/footer.css` | **Update** | Change `.foot-col h4` → `.foot-col h3` selector |
| `index.html` | **Update** | Add skip link, `<main id="main">`, JSON-LD in `<head>` |
| `css/index.css` (inline `<style>`) | **Update** | Add `.skip-link` CSS inside the `<style>` block in `index.html` |
| `robots.txt` | **Verify** | Already correct — confirm no action needed |
| `lyftora-coach-ai.html.bak` | **Delete** | Remove backup file |

---

## Task 1: Rewrite `functions/api/waitlist.js`

**Files:**
- Modify: `functions/api/waitlist.js`

- [ ] **Step 1.1: Read the current file to understand what gets replaced**

```bash
cat functions/api/waitlist.js
```

Expected: the existing stub that only sends a notification email to the owner, no Supabase, no rate-limiting.

- [ ] **Step 1.2: Write the new function**

Replace the entire contents of `functions/api/waitlist.js` with:

```js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://lyftora.in',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const BASE_HEADERS = {
  ...CORS_HEADERS,
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: BASE_HEADERS });
}

/* ── OPTIONS (CORS preflight) ── */
export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/* ── POST /api/waitlist ── */
export async function onRequestPost(context) {
  const { request, env, ctx } = context;

  /* Parse body */
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  const source = (typeof body.source === 'string' ? body.source : 'lyftora.in').slice(0, 100);
  const ref = (typeof body.ref === 'string' ? body.ref : null)?.slice(0, 200) ?? null;

  /* Validate email */
  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: 'invalid_email' }, 400);
  }

  /* Rate limit: max 5 per IP per hour via KV */
  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const rlKey = `rl:${ip}:${Math.floor(Date.now() / 3_600_000)}`;
  try {
    const raw = await env.RATE_LIMIT_KV.get(rlKey);
    const count = raw ? parseInt(raw, 10) : 0;
    if (count >= 5) {
      return json({ ok: false, error: 'rate_limited' }, 429);
    }
    /* Fire-and-forget the KV increment so it doesn't add latency */
    ctx.waitUntil(
      env.RATE_LIMIT_KV.put(rlKey, String(count + 1), { expirationTtl: 3600 })
    );
  } catch (err) {
    /* KV failure is non-fatal — log and continue */
    console.error('[waitlist] KV error:', err);
  }

  /* Compute ip_hash: SHA-256(ip + IP_SALT), first 16 hex chars */
  let ip_hash = null;
  try {
    const salt = env.IP_SALT || '';
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(ip + salt)
    );
    ip_hash = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 16);
  } catch (err) {
    console.error('[waitlist] hash error:', err);
  }

  const country = request.cf?.country ?? null;
  const user_agent = (request.headers.get('User-Agent') || '').slice(0, 300);

  /* Insert into Supabase */
  const supabaseUrl = env.SUPABASE_URL || 'https://obhpbaapxsjwrhzvfjnl.supabase.co';
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseKey) {
    console.error('[waitlist] SUPABASE_SERVICE_ROLE_KEY is not set');
    return json({ ok: false, error: 'server_error' }, 500);
  }

  let position = null;
  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ email, source, ref, ip_hash, user_agent, country }),
    });

    if (!insertRes.ok) {
      const detail = await insertRes.text();
      console.error('[waitlist] Supabase insert error', insertRes.status, detail);
      return json({ ok: false, error: 'server_error' }, 500);
    }

    /* Cheap count for position */
    try {
      const countRes = await fetch(
        `${supabaseUrl}/rest/v1/waitlist?select=count`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'count=exact',
            'Range-Unit': 'items',
            Range: '0-0',
          },
        }
      );
      const contentRange = countRes.headers.get('Content-Range') || '';
      const match = contentRange.match(/\/(\d+)$/);
      if (match) position = parseInt(match[1], 10);
    } catch {
      /* position is optional — swallow */
    }
  } catch (err) {
    console.error('[waitlist] Supabase fetch error:', err);
    return json({ ok: false, error: 'server_error' }, 500);
  }

  /* Fire-and-forget confirmation email via Resend */
  const resendKey = env.RESEND_API_KEY;
  if (!resendKey) {
    console.error('[waitlist] RESEND_API_KEY is not set');
  } else {
    const fromAddress = env.RESEND_FROM || 'onboarding@resend.dev';
    if (!env.RESEND_FROM) {
      console.warn('[waitlist] RESEND_FROM not set — using onboarding@resend.dev fallback');
    }

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f6f3ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f3ea;padding:48px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#f6f3ea;max-width:560px;width:100%;">
        <tr><td style="padding:0 32px 28px;">
          <p style="margin:0;font-size:28px;font-weight:700;letter-spacing:-0.02em;color:#0E0E12;">Lyftora<span style="color:#FF5A3C;">.</span></p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0 0 16px;font-size:22px;font-weight:600;color:#0E0E12;line-height:1.3;">
            You're on the list — we'll email you the moment we ship.
          </p>
          <p style="margin:0 0 24px;font-size:16px;color:#6B6A63;line-height:1.6;">
            Thanks for joining the Lyftora waitlist. We're building an AI personal trainer that doesn't charge rent — personalised plans, real food, no monthly fee.
          </p>
          <p style="margin:0;font-size:16px;color:#6B6A63;line-height:1.6;">
            We'll only email you when it matters.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 48px;border-top:1px solid rgba(14,14,18,0.1);padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#9B9A93;line-height:1.6;">
            &copy; ${new Date().getFullYear()} Lyftora &middot; lyftora.in<br/>
            Reply STOP and we'll remove you immediately.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const emailText = `You're on the Lyftora list.\n\nWe'll email you the moment we ship. Thanks for joining.\n\n— The Lyftora team\nhttps://lyftora.in\n\nReply STOP and we'll remove you immediately.`;

    ctx.waitUntil(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: "You're on the Lyftora list.",
          html: emailHtml,
          text: emailText,
        }),
      }).then(async r => {
        if (!r.ok) {
          console.error('[waitlist] Resend error', r.status, await r.text());
        }
      }).catch(err => {
        console.error('[waitlist] Resend fetch error:', err);
      })
    );
  }

  return json({ ok: true, ...(position !== null ? { position } : {}) });
}

/* ── Catch-all: 405 for GET, HEAD, PUT, PATCH, DELETE ── */
export async function onRequest(context) {
  return new Response(JSON.stringify({ ok: false, error: 'method_not_allowed' }), {
    status: 405,
    headers: {
      ...BASE_HEADERS,
      Allow: 'POST, OPTIONS',
    },
  });
}
```

- [ ] **Step 1.3: Verify no secrets are hardcoded**

```bash
grep -E "(sk_|re_|eyJ|service_role)" functions/api/waitlist.js
```

Expected: no output (zero matches).

- [ ] **Step 1.4: Commit**

```bash
git add functions/api/waitlist.js
git commit -m "feat(api): rewrite waitlist function with Supabase, KV rate-limit, Resend confirmation"
```

---

## Task 2: Create Supabase migration file

**Files:**
- Create: `db/migrations/0001_waitlist.sql`

- [ ] **Step 2.1: Create the directory and file**

Create `db/migrations/0001_waitlist.sql`:

```sql
create extension if not exists citext;
create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null unique,
  source       text,
  ref          text,
  ip_hash      text,
  user_agent   text,
  country      text,
  created_at   timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);

-- Lock the table down. Only the service role (used by the Cloudflare Function) can write.
alter table public.waitlist enable row level security;

revoke all on public.waitlist from anon, authenticated;
-- (service_role bypasses RLS, so no explicit policy is needed for it.)
```

- [ ] **Step 2.2: Confirm the file is correct**

```bash
cat db/migrations/0001_waitlist.sql
```

Expected: see the SQL above with both `citext` and `pgcrypto` extensions, the `waitlist` table, and the RLS enable + revoke statements.

- [ ] **Step 2.3: Commit**

```bash
git add db/migrations/0001_waitlist.sql
git commit -m "feat(db): add waitlist table migration with citext, RLS"
```

---

## Task 3: Update `_headers` (Cloudflare Pages)

**Files:**
- Modify: `_headers`

The current `_headers` is missing: `/css/*` cache rules, `/js/*` cache rules, `Content-Signal` header, `interest-cohort` in Permissions-Policy, and `/api/*` no-store rule.

- [ ] **Step 3.1: Read the current file**

```bash
cat _headers
```

Expected output (current state):
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/assets/fonts/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable
```

- [ ] **Step 3.2: Replace `_headers` with the complete updated version**

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), interest-cohort=()
  Content-Signal: search=yes, ai-train=no
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

/css/*
  Cache-Control: public, max-age=31536000, immutable

/js/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/assets/fonts/*
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/api/*
  Cache-Control: no-store
```

- [ ] **Step 3.3: Verify**

```bash
cat _headers
```

Confirm `Content-Signal`, `interest-cohort`, `/css/*`, `/js/*`, `/api/*` are all present.

- [ ] **Step 3.4: Commit**

```bash
git add _headers
git commit -m "fix(headers): add Content-Signal, interest-cohort, js/css cache rules, api no-store"
```

---

## Task 4: Fix footer heading hierarchy (`h4` → `h3`) and remove dead links

**Files:**
- Modify: `js/footer.js`
- Modify: `css/footer.css`

The footer is dynamically injected by `footer.js`. The three column headings are `<h4>` (Product, Company, Follow), which creates an `h2 → h4` jump in the heading hierarchy. Additionally, `Manifesto`, `Careers`, `Press` link to `#` (dead), and all three social links (Instagram, YouTube, X/Twitter) link to `#` (dead).

- [ ] **Step 4.1: Read both files**

```bash
cat js/footer.js
cat css/footer.css
```

- [ ] **Step 4.2: Update `js/footer.js`**

Make these three changes in the template string inside `footer.js`:

1. Change `<h4>Product</h4>` → `<h3>Product</h3>`
2. Change `<h4>Company</h4>` → `<h3>Company</h3>`
3. Change `<h4>Follow</h4>` → `<h3>Follow</h3>`
4. In the Product column — keep Features, Coach AI, FAQ links as-is.
5. In the Company column — remove the `<li>` for Manifesto, Careers, Press. Keep Privacy, `hello@lyftora.in`, `support@lyftora.in`.
6. In the Follow column — remove all three `<li><a href="#">...</a></li>` items entirely. Since all three are dead links, the entire Follow column body will be empty. Remove the entire Follow `<div class="foot-col">` block (heading + empty list = noise).

The updated `html` template string should look like this (full replacement):

```js
  const html = `
<footer>
  <div class="container">
    <div class="foot-brand-big">Lyftora<span style="color:var(--coral)">.</span></div>
    <div class="footer-grid" style="margin-top:40px">
      <div>
        <p style="max-width:34ch;font-size:15px;color:var(--muted);">
          The AI personal trainer that doesn't charge rent. Built for people who train for life, not for a promo code.
        </p>
      </div>
      <div class="foot-col">
        <h3>Product</h3>
        <ul>
          <li><a href="${BASE}index.html#features">Features</a></li>
          <li><a href="${BASE}lyftora-coach-ai.html">Coach AI</a></li>
          <li><a href="${BASE}index.html#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h3>Company</h3>
        <ul>
          <li><a href="${BASE}privacy.html">Privacy</a></li>
          <li><a href="mailto:hello@lyftora.in">hello@lyftora.in</a></li>
          <li><a href="mailto:support@lyftora.in">support@lyftora.in</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-bottom">
      <div>&copy; ${new Date().getFullYear()} Lyftora &middot; Made with care.</div>
      <div>Pre-launch &middot; Coming soon</div>
    </div>
  </div>
</footer>`;
```

- [ ] **Step 4.3: Update `css/footer.css`**

Change the CSS selector from `.foot-col h4` to `.foot-col h3`:

Old:
```css
.foot-col h4 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--muted);
  margin-bottom: 14px;
}
```

New:
```css
.foot-col h3 {
  font-family: var(--mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: var(--muted);
  margin-bottom: 14px;
}
```

- [ ] **Step 4.4: Commit**

```bash
git add js/footer.js css/footer.css
git commit -m "fix(a11y): fix h4→h3 footer headings, remove dead # links"
```

---

## Task 5: Add skip link and `<main>` wrapper to `index.html`

**Files:**
- Modify: `index.html` (HTML structure + inline `<style>` block)

The page has no skip link and no `<main>` landmark. The `<body>` opens directly into `<div class="cs-wrap">`, then the first element is `<section class="cs-hero">`.

- [ ] **Step 5.1: Locate the body opening and first section**

```bash
grep -n "<body>\|cs-wrap\|cs-hero\|<main\|skip" index.html
```

Expected: lines ~523-527 show `<body>`, `<div class="cs-wrap">`, `<section class="cs-hero">`.

- [ ] **Step 5.2: Add the skip link immediately after `<body>`**

In `index.html`, after the `<body>` tag and before `<div class="cs-wrap">`, add:

```html
<a class="skip-link" href="#main">Skip to content</a>
```

- [ ] **Step 5.3: Add `<main id="main">` wrapper**

The main content starts after the navbar (which is injected by `navbar.js` at page load before the first section). Wrap the content sections inside `<div class="cs-wrap">` with a `<main id="main">` tag.

Insert `<main id="main">` immediately after `<div class="cs-wrap">` (and before `<section class="cs-hero">`), and insert `</main>` immediately before the `<footer></footer>` line.

- [ ] **Step 5.4: Add skip-link CSS to the inline `<style>` block in `index.html`**

Inside the `<style>` block (which already exists in `<head>` of `index.html`), append before the closing `</style>`:

```css
/* ── Skip link ── */
.skip-link {
  position: absolute;
  left: -9999px;
  top: auto;
  z-index: 9999;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  background: #0E0E12;
  color: #F4EFE4;
  padding: .5rem .75rem;
  border-radius: .5rem;
  font-family: var(--sans);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  outline: 2px solid var(--lime);
  outline-offset: 2px;
}
```

- [ ] **Step 5.5: Verify the structure**

```bash
grep -n "skip-link\|<main\|</main\|<body\|cs-wrap" index.html
```

Expected:
- skip-link CSS in `<head>`
- `<a class="skip-link" href="#main">` right after `<body>`
- `<main id="main">` after `<div class="cs-wrap">`
- `</main>` before `<footer></footer>`

- [ ] **Step 5.6: Commit**

```bash
git add index.html
git commit -m "fix(a11y): add skip-to-content link and <main> landmark"
```

---

## Task 6: Add JSON-LD structured data to `index.html`

**Files:**
- Modify: `index.html` (add two `<script type="application/ld+json">` blocks in `<head>`)

No logo file exists in `assets/icons/`. The preview thumbnail at `assets/images/lyftora-preview-thumbnail.png` is not a square logo, so omit `logo` from the JSON-LD. Social handles all have `href="#"` in the footer (dead), so omit `sameAs`.

- [ ] **Step 6.1: Add JSON-LD before `</head>`**

In `index.html`, immediately before the closing `</head>` tag, add:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Lyftora",
  "url": "https://lyftora.in"
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Lyftora",
  "url": "https://lyftora.in"
}
</script>
```

- [ ] **Step 6.2: Verify placement**

```bash
grep -n "ld+json\|</head>" index.html
```

Expected: two `ld+json` script blocks appear before `</head>`.

- [ ] **Step 6.3: Commit**

```bash
git add index.html
git commit -m "feat(seo): add JSON-LD Organization and WebSite structured data"
```

---

## Task 7: Delete `lyftora-coach-ai.html.bak`

**Files:**
- Delete: `lyftora-coach-ai.html.bak`

- [ ] **Step 7.1: Confirm the file exists**

```bash
ls lyftora-coach-ai.html.bak
```

Expected: file listed.

- [ ] **Step 7.2: Delete the file via git**

```bash
git rm lyftora-coach-ai.html.bak
```

- [ ] **Step 7.3: Commit**

```bash
git commit -m "chore: delete lyftora-coach-ai.html.bak backup file"
```

---

## Task 8: Verify `robots.txt` (no action needed — document the check)

**Files:**
- Verify: `robots.txt`

- [ ] **Step 8.1: Confirm robots.txt is already clean**

```bash
cat robots.txt
```

Expected output:
```
User-agent: *
Allow: /

Sitemap: https://lyftora.in/sitemap.xml
```

If the file matches exactly: no action needed. If it has `Content-Signal` or other unknown directives, remove them.

---

## Task 9: Update README with Cloudflare deployment note

**Files:**
- Modify: `README.md`

- [ ] **Step 9.1: Read the current README**

```bash
cat README.md
```

- [ ] **Step 9.2: Add deployment note**

Append to `README.md` (add a new section or add to existing deployment section):

```markdown
## Deployment

Cloudflare Pages auto-deploys from `master`. Pull requests get preview URLs automatically.

**Environment variables** must be set in Cloudflare Dashboard → Workers & Pages → `lyftora-website` → Settings → Variables and Secrets. Never commit secrets to the repo.

Required secrets (set as Secrets, not plain text):
- `SUPABASE_URL` — Supabase project REST URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (NOT the anon key)
- `RESEND_API_KEY` — Resend API key with Sending access
- `RESEND_FROM` — Verified from address e.g. `Lyftora <hello@lyftora.in>`
- `IP_SALT` — 32+ character random string for IP hashing

Required KV binding:
- Variable name: `RATE_LIMIT_KV` → KV namespace: `lyftora-rate-limit`
```

- [ ] **Step 9.3: Commit**

```bash
git add README.md
git commit -m "docs: add Cloudflare deployment and env var instructions to README"
```

---

## Task 10: Verify no secrets in repo

- [ ] **Step 10.1: Run secret scan**

```bash
grep -r -E "(sk_|re_|eyJ|service_role)" . --exclude-dir=.git
```

Expected: no output. If any match found, remove the secret from the file and rotate it immediately.

- [ ] **Step 10.2: Check .gitignore covers sensitive files**

```bash
cat .gitignore
```

Confirm `.env` and similar patterns are listed. If not, add them.

---

## Human Dashboard Steps (copy into PR description verbatim)

### Supabase
1. Open the Supabase SQL editor for project `obhpbaapxsjwrhzvfjnl`.
2. Paste and run the contents of `db/migrations/0001_waitlist.sql`.
3. Settings → API → copy the **service_role** key (NOT anon). Paste it into Cloudflare in the next step.

### Resend
1. Domains → confirm `lyftora.in` (or `mail.lyftora.in`) is verified. If not, add the DNS records Resend shows. Porkbun is the registrar; add the records there.
2. API Keys → create a key named `cloudflare-pages-waitlist` with **Sending access**. Copy the key.
3. Decide the from address. If `lyftora.in` is verified, use `hello@lyftora.in`. Otherwise temporarily use `onboarding@resend.dev`.

### Cloudflare
1. Cloudflare dashboard → Workers & Pages → `lyftora-website` → **Settings → Variables and Secrets** → Production. Add (all as Secrets, not plain text):
   - `SUPABASE_URL` = `https://obhpbaapxsjwrhzvfjnl.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase step 3)
   - `RESEND_API_KEY` = (from Resend step 2)
   - `RESEND_FROM` = `Lyftora <hello@lyftora.in>` (or the fallback `onboarding@resend.dev`)
   - `IP_SALT` = (any 32+ char random string — e.g. `openssl rand -hex 32`)
2. Same page → Functions → KV namespace bindings → Create a binding:
   - Variable name: `RATE_LIMIT_KV`
   - KV namespace: create a new one called `lyftora-rate-limit` (Workers & Pages → KV → Create namespace).
3. Re-deploy: Deployments → "Retry deployment" on the latest, or push the PR to `master`.
4. Verify: `curl -X POST https://lyftora.in/api/waitlist -H 'Content-Type: application/json' -d '{"email":"you+test@yourdomain.com"}'` → expect `200 {"ok":true}`. Then check Supabase → Table editor → `waitlist` for the row, and your inbox for the confirmation.

### Post-deploy
1. Search Console → Sitemaps → resubmit `https://lyftora.in/sitemap.xml`.
2. PageSpeed Insights → re-run for both mobile and desktop. Expected: SEO 100, Best Practices 100, A11y ≥ 95, Performance ≥ 95 mobile.
3. Test the form on a real phone over cellular, not just desktop wifi.

---

## Acceptance Criteria

- [ ] `POST /api/waitlist` with a valid email returns `200 {"ok":true}` and a row appears in Supabase.
- [ ] Same email twice does not create a duplicate row (unique constraint + `merge-duplicates`).
- [ ] Sixth submission from the same IP within an hour returns `429`.
- [ ] Bad JSON / missing email returns `400 {"ok":false,"error":"invalid_email"}`.
- [ ] Confirmation email arrives within 30s of a real submission.
- [ ] On submit success, the form is replaced with the inline success block.
- [ ] `/robots.txt` is clean (no unknown directives).
- [ ] Lighthouse A11y ≥ 95 on both desktop and mobile.
- [ ] No `.bak` files in repo (`find . -name "*.bak" --exclude-dir=.git` returns nothing).
- [ ] No secrets present (`grep -r -E "(sk_|re_|eyJ)" .` returns nothing).
