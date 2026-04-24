/* ============================================
   Lyftora — Pricing Page Scripts
   ============================================ */

// ---------- Custom cursor ----------
(() => {
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  let x = window.innerWidth / 2, y = window.innerHeight / 2;
  let rx = x, ry = y;
  document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
  function tick() {
    rx += (x - rx) * 0.18;
    ry += (y - ry) * 0.18;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  const hoverables = document.querySelectorAll('a, button, .plan, .faq summary');
  hoverables.forEach(el => {
    el.addEventListener('mouseenter', () => { dot.classList.add('is-hover'); ring.classList.add('is-hover'); });
    el.addEventListener('mouseleave', () => { dot.classList.remove('is-hover'); ring.classList.remove('is-hover'); });
  });
})();

// ---------- Billing toggle with sliding pill and number roll ----------
(() => {
  const toggle = document.querySelector('.bill-toggle');
  if (!toggle) return;
  const btns = toggle.querySelectorAll('button');
  const slider = document.getElementById('bt-slider');
  const nums = document.querySelectorAll('.num-roll');
  const suffixes = document.querySelectorAll('[data-suffix]');
  const notes = document.querySelectorAll('[data-note]');

  function positionSlider(btn) {
    const tr = toggle.getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    slider.style.width = r.width + 'px';
    slider.style.transform = `translateX(${r.left - tr.left - 5}px)`;
  }

  function rollNumber(el, to) {
    const from = parseInt(el.textContent, 10) || 0;
    const dur = 650; const s = performance.now();
    function step(t) {
      const pr = Math.min(1, (t - s) / dur);
      const e = 1 - Math.pow(1 - pr, 3);
      const v = Math.round(from + (to - from) * e);
      el.textContent = v.toLocaleString('en-IN');
      if (pr < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function apply(bill) {
    const yr = bill === 'year';
    nums.forEach(n => {
      const to = parseInt(yr ? n.dataset.valY : n.dataset.val, 10);
      rollNumber(n, to);
    });
    suffixes.forEach(s => s.textContent = yr ? '/mo \u00B7 billed yearly' : '/month');
    notes.forEach((n, i) => {
      if (i === 0) n.textContent = yr ? 'No card \u00B7 Stays free forever' : 'No credit card. No clock.';
      else if (i === 1) n.textContent = yr ? 'Billed \u20B92,499/year \u00B7 Save \u20B91,089' : 'Billed monthly \u00B7 Cancel in two taps';
      else n.textContent = yr ? '\u20B96,708/year \u00B7 5 seats' : '5 seats \u00B7 Billed to one card';
    });
  }

  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.classList.remove('on')); b.classList.add('on');
    positionSlider(b); apply(b.dataset.bill);
  }));

  // init
  window.addEventListener('load', () => positionSlider(toggle.querySelector('.on')));
  window.addEventListener('resize', () => positionSlider(toggle.querySelector('.on')));
  setTimeout(() => positionSlider(toggle.querySelector('.on')), 50);
})();

// ---------- Confetti on CTAs ----------
(() => {
  const colors = ['#D6FF4D', '#FF5A3C', '#7B5CFF', '#6EE0FF', '#F4EFE4', '#0E0E12'];
  function burst(x, y) {
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div'); c.className = 'confetti';
      c.style.background = colors[i % colors.length];
      c.style.left = x + 'px'; c.style.top = y + 'px';
      document.body.appendChild(c);
      const ang = Math.random() * Math.PI * 2;
      const v = 260 + Math.random() * 240;
      const dx = Math.cos(ang) * v; const dy = Math.sin(ang) * v - 140;
      const rot = (Math.random() * 720 - 360);
      c.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx}px,${dy + 460}px) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
      setTimeout(() => c.remove(), 1600);
    }
  }
  document.querySelectorAll('[data-confetti]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const r = btn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2);
    });
  });
})();

// ---------- Magnetic nudge on CTAs ----------
(() => {
  document.querySelectorAll('.btn-primary,.nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * .25;
      const y = (e.clientY - r.top - r.height / 2) * .25;
      btn.style.transform = `translate(${x}px,${y}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });
})();
