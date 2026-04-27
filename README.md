# Lyftora Website

Static marketing site for Lyftora, hosted on Cloudflare Pages.

## Structure

```
/
├── index.html                  # Landing page
├── pricing.html                # Pricing page
├── lyftora-coach-ai.html       # Coach AI feature page
├── css/
│   ├── tokens.css              # Design tokens (colors, spacing, type)
│   ├── index.css
│   ├── pricing.css
│   └── coach-ai.css
├── js/
│   ├── index.js
│   ├── pricing.js
│   └── coach-ai.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── legal/                      # Privacy, terms (to be added)
├── _headers                    # Security + cache headers
├── _redirects                  # Short-URL aliases
├── robots.txt
└── sitemap.xml
```

## Local preview

No build step — pure static HTML. Open `index.html` in a browser, or run:

```bash
npx serve .
# or
python3 -m http.server 8000
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select this repo.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Root directory:** `/`
5. Deploy. Every push to `main` ships to production; PRs get preview URLs.

## Custom domain

Dashboard → your Pages project → **Custom domains** → add `lyftora.com` and `www.lyftora.com`. Cloudflare handles the DNS + SSL.

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
