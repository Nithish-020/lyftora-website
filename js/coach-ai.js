/* ============================================================
   Lyftora Coach AI — Page Scripts
   Page: lyftora-coach-ai.html
   Build date: 2026-04-23
   ============================================================ */

/* ── Reveal on scroll ── */
(() => {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(e => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); },
    { rootMargin: '0px 0px -8% 0px' }
  );
  els.forEach(e => io.observe(e));
  // Fallback: ensure all are visible after 1.6s regardless
  setTimeout(() => els.forEach(e => e.classList.add('in')), 1600);
})();

/* ── Trigger stroke/fill animations on chart scroll-in ── */
(() => {
  ['volChart', 'pchart'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const io = new IntersectionObserver(
      es => { es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); },
      { rootMargin: '0px 0px -15% 0px' }
    );
    io.observe(el);
  });
})();

/* ── Manuscript rail: highlight active step on scroll ── */
(() => {
  const steps = document.querySelectorAll('.manu-step');
  const btns = document.querySelectorAll('#rail button');
  if (!steps.length || !btns.length) return;

  function setActiveStep(activeStep) {
    btns.forEach(b => {
      const isActive = b.dataset.step === activeStep;
      b.classList.toggle('on', isActive);
      b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    steps.forEach(s => {
      const isActive = s.dataset.step === activeStep;
      if (isActive) {
        s.removeAttribute('aria-hidden');
      } else {
        s.setAttribute('aria-hidden', 'true');
      }
    });
  }

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        setActiveStep(e.target.dataset.step);
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  steps.forEach(s => io.observe(s));

  btns.forEach(b => b.addEventListener('click', () => {
    const t = document.getElementById('step-' + b.dataset.step);
    if (t) {
      setActiveStep(b.dataset.step);
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }));
})();
/* ── Pantry typer (storyboard feature block) ── */
(() => {
  const target = document.getElementById('pantry-live-text');
  if (!target) return;

  const list = [
    'eggs', 'paneer', 'oats', 'brown rice', 'moong dal',
    'spinach', 'cucumber', 'curd', 'olive oil', 'almonds',
    'tomato', 'ginger', 'garlic', 'green chili'
  ];

  let i = 0, j = 0, s = '';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) {
    target.textContent = list.slice(0, 8).join(', ');
    return;
  }

  function step() {
    const word = list[i];
    if (j < word.length) {
      s += word[j]; j++;
      target.textContent = s;
      setTimeout(step, 35 + Math.random() * 60);
    } else if (i < list.length - 1) {
      s += ', '; i++; j = 0;
      target.textContent = s;
      setTimeout(step, 180);
    } else {
      setTimeout(() => { s = ''; i = 0; j = 0; target.textContent = ''; setTimeout(step, 1400); }, 4200);
    }
  }

  // Only run when section is visible
  const storyHero = target.closest('.story-hero');
  if (!storyHero) return;

  const io = new IntersectionObserver(
    es => { es.forEach(e => { if (e.isIntersecting) { step(); io.disconnect(); } }); },
    { rootMargin: '0px 0px -20% 0px' }
  );
  io.observe(storyHero);
})();

/* ── Phone chat auto-play on scroll-in ── */
(() => {
  const stream = document.getElementById('phone-stream');
  const phoneEl = document.getElementById('phone');
  if (!stream || !phoneEl) return;

  const script = [
    { who: 'c', t: "Before we start — any conditions I should know about?" },
    { who: 'u', t: "PCOS, mild back pain." },
    { who: 'c', t: "Got it. Anti-inflammatory diet, resistance priority, no heavy axial loading. What's in your kitchen?" },
    { who: 'u', t: "Eggs, paneer, oats, brown rice, lots of veg." },
    { who: 'c', t: "Perfect. 4-week plan coming. Week 1 tonight." }
  ];

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function play() {
    stream.innerHTML = '';
    let delay = 0;

    script.forEach((m, i) => {
      const isCoach = m.who === 'c';

      if (isCoach && i > 0 && !reduced) {
        delay += 420;
        setTimeout(() => {
          const tip = document.createElement('div');
          tip.className = 'typ';
          tip.setAttribute('aria-hidden', 'true');
          tip.innerHTML = '<i></i><i></i><i></i>';
          stream.appendChild(tip);
          setTimeout(() => tip.remove(), 680);
        }, delay);
        delay += 680;
      } else {
        delay += reduced ? 0 : 600;
      }

      setTimeout(() => {
        const b = document.createElement('div');
        b.className = 'bub ' + (isCoach ? 'c' : 'u');
        b.textContent = m.t;
        stream.appendChild(b);
      }, delay);
    });
  }

  const io = new IntersectionObserver(
    es => { es.forEach(e => { if (e.isIntersecting) { play(); io.unobserve(e.target); } }); },
    { rootMargin: '0px 0px -10% 0px' }
  );
  io.observe(phoneEl);
})();

/* ── Live calculator ── */
(() => {
  const ageEl  = document.getElementById('c-age');
  const kgEl   = document.getElementById('c-kg');
  const cmEl   = document.getElementById('c-cm');
  const oAge   = document.getElementById('o-age');
  const oKg    = document.getElementById('o-kg');
  const oCm    = document.getElementById('o-cm');
  if (!ageEl) return;

  let sex      = 'F';
  let activity = 1.375;
  let goal     = 'loss';

  const sexBtns  = document.querySelectorAll('.seg [data-sex]');
  const actBtns  = document.querySelectorAll('.seg [data-act]');
  const goalBtns = document.querySelectorAll('.seg [data-goal]');

  const fmt = n => Math.round(n).toLocaleString('en-IN');

  function compute() {
    const a = +ageEl.value;
    const k = +kgEl.value;
    const h = +cmEl.value;

    oAge.textContent = a;
    oKg.textContent  = k;
    oCm.textContent  = h;

    const bmi = k / ((h / 100) ** 2);
    const bmr = sex === 'M'
      ? (10 * k + 6.25 * h - 5 * a + 5)
      : (10 * k + 6.25 * h - 5 * a - 161);
    const tdee = bmr * activity;

    let target, prot;
    if (goal === 'loss')       { target = tdee - 500; prot = k * 1.8; }
    else if (goal === 'gain')  { target = tdee + 300; prot = k * 2.2; }
    else                       { target = tdee;        prot = k * 1.6; }

    const water = (k * 0.033).toFixed(1);
    const maxHr = 220 - a;
    const cls   = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'above';

    document.getElementById('r-bmi').innerHTML    = `${bmi.toFixed(1)}<em>${cls}</em>`;
    document.getElementById('r-bmr').innerHTML    = `${fmt(bmr)}<em>kcal</em>`;
    document.getElementById('r-tdee').innerHTML   = `${fmt(tdee)}<em>kcal</em>`;
    document.getElementById('r-target').innerHTML = `${fmt(target)}<em>kcal</em>`;
    document.getElementById('r-prot').innerHTML   = `${fmt(prot)}<em>g</em>`;
    document.getElementById('r-water').innerHTML  = `${water}<em>L</em>`;
    document.getElementById('r-hr').innerHTML     = `${maxHr}<em>bpm</em>`;
  }

  [ageEl, kgEl, cmEl].forEach(i => i.addEventListener('input', compute));

  sexBtns.forEach(b => b.addEventListener('click', () => {
    sexBtns.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-pressed', 'true');
    sex = b.dataset.sex;
    compute();
  }));

  actBtns.forEach(b => b.addEventListener('click', () => {
    actBtns.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-pressed', 'true');
    activity = +b.dataset.act;
    compute();
  }));

  goalBtns.forEach(b => b.addEventListener('click', () => {
    goalBtns.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on');
    b.setAttribute('aria-pressed', 'true');
    b.setAttribute('aria-pressed', 'true');
    goal = b.dataset.goal;
    compute();
  }));

  compute(); // Initial render
})();

/* ── FAQ accordion: exclusive open + smooth animation ── */
(() => {
  const faqs = document.querySelectorAll('.faq');
  if (!faqs.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION_OPEN  = reduced ? 0 : 360;
  const DURATION_CLOSE = reduced ? 0 : 280;
  const EASING = 'cubic-bezier(0.2, 0.9, 0.3, 1)';

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

  faqs.forEach(faq => {
    const summary = faq.querySelector('summary');
    if (!summary) return;

    summary.addEventListener('click', e => {
      e.preventDefault();

      if (faq.hasAttribute('open')) {
        closePanel(faq);
      } else {
        // Close every other open panel first
        faqs.forEach(other => {
          if (other !== faq && other.hasAttribute('open')) closePanel(other);
        });
        openPanel(faq);
      }
    });
  });
})();
