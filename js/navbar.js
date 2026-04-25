/**
 * Lyftora — Shared Site Navbar
 *
 * Injects a shared navigation bar that links between dedicated pages only.
 * No in-page anchor links are included here — those belong to the page itself.
 *
 * Pages:
 *   Home      → index.html
 *   Coach AI  → lyftora-coach-ai.html
 *   Pricing   → pricing.html
 */
(function () {
  'use strict';

  /** Page definitions — page-level routes only */
  const PAGES = [
    { label: 'Home',     href: 'index.html',            key: 'home'     },
    { label: 'Coach AI', href: 'lyftora-coach-ai.html', key: 'coach-ai' },
    { label: 'Pricing',  href: 'pricing.html',          key: 'pricing'  },
  ];

  const CTA_HREF  = 'pricing.html';
  const CTA_LABEL = 'Get Lyftora';

  /** Detect which page is currently active from the URL */
  function detectActivePage() {
    const path = window.location.pathname;
    if (
      path === '/' ||
      path.endsWith('/index.html') ||
      path.endsWith('/')
    ) return 'home';
    if (path.includes('pricing') || path.includes('/plans')) return 'pricing';
    if (
      path.includes('coach-ai') ||
      path.includes('coach') ||
      path.includes('/coach')
    ) return 'coach-ai';
    return null;
  }

  /** Build an anchor tag with optional aria-current */
  function link(href, label, className, isActive) {
    const current = isActive ? ' aria-current="page"' : '';
    return `<a href="${href}" class="${className}"${current}>${label}</a>`;
  }

  /** Inject the navbar into the DOM and wire up interactions */
  function init() {
    const activePage = detectActivePage();

    /* ── Desktop nav links ── */
    const desktopLinks = PAGES
      .map(p => link(p.href, p.label, 'site-nav-link', p.key === activePage))
      .join('');

    /* ── Mobile drawer links ── */
    const drawerLinks = PAGES
      .map(p => link(p.href, p.label, 'site-nav-drawer-link', p.key === activePage))
      .join('');

    /* ── Build <nav> ── */
    const nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = `
      <a href="index.html" class="site-nav-brand" aria-label="Lyftora home">
        <span class="site-nav-dot" aria-hidden="true"></span>
        Lyftora
      </a>
      <div class="site-nav-links" role="list">
        ${desktopLinks}
      </div>
      <div class="site-nav-end">
        <a href="${CTA_HREF}" class="site-nav-cta">
          ${CTA_LABEL} <span aria-hidden="true">&#8599;</span>
        </a>
        <button
          class="site-nav-burger"
          aria-label="Toggle navigation menu"
          aria-expanded="false"
          aria-controls="site-nav-drawer"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    `;

    /* ── Build mobile drawer ── */
    const drawer = document.createElement('div');
    drawer.className = 'site-nav-drawer';
    drawer.id = 'site-nav-drawer';
    drawer.setAttribute('aria-label', 'Mobile navigation');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.innerHTML =
      drawerLinks +
      `<a href="${CTA_HREF}" class="site-nav-drawer-cta">${CTA_LABEL} &#8599;</a>`;

    /* Insert both at the very beginning of <body> */
    document.body.insertAdjacentElement('afterbegin', drawer);
    document.body.insertAdjacentElement('afterbegin', nav);

    /* ── Burger toggle ── */
    const burger = nav.querySelector('.site-nav-burger');

    function openDrawer() {
      nav.classList.add('is-open');
      drawer.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      drawer.setAttribute('aria-hidden', 'false');
      drawer.setAttribute('aria-modal', 'true');
      drawer.setAttribute('role', 'dialog');
      var firstLink = drawer.querySelector('a');
      if (firstLink) firstLink.focus();
    }

    function closeDrawer() {
      nav.classList.remove('is-open');
      drawer.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.removeAttribute('aria-modal');
      drawer.removeAttribute('role');
      burger.focus();
    }

    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      nav.classList.contains('is-open') ? closeDrawer() : openDrawer();
    });

    /* Close on Escape */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !drawer.contains(e.target)) {
        closeDrawer();
      }
    });

    /* Close drawer when a drawer link is clicked (navigation) */
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* Wait for DOM if needed */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
