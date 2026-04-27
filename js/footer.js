(() => {
  const BASE = (() => {
    const depth = location.pathname.replace(/\/[^/]*$/, '').split('/').filter(Boolean).length;
    return depth > 0 ? '../'.repeat(depth) : '';
  })();

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
          <li><a href="${BASE}lyftora-coach-ai.html">Coach AI</a></li>
        </ul>
      </div>
      <div class="foot-col">
        <h3>Company</h3>
        <ul>
          <li><a href="${BASE}privacy.html">Privacy</a></li>
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

  const existing = document.querySelector('footer');
  if (existing) {
    existing.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // Scroll-to-top button
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`;
  document.body.appendChild(btn);

  const onScroll = () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
