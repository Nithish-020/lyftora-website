# Lyftora Website

Static marketing site for Lyftora, hosted on Cloudflare Pages.

## Structure

```
/
├── index.html              # Landing page
├── pricing.html            # Pricing page
├── features/
│   └── coach-ai.html       # Coach AI feature page
├── legal/                  # Privacy, terms, etc.
├── assets/
│   ├── css/                # Shared stylesheets (if extracted)
│   ├── js/                 # Shared scripts
│   ├── images/             # Marketing images, screenshots
│   ├── icons/              # Favicon, app icons
│   └── fonts/              # Self-hosted fonts (optional)
├── _headers                # Cloudflare Pages security + cache headers
├── _redirects              # Cloudflare Pages redirects & SPA fallback
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
