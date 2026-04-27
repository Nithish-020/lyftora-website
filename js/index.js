/* ============================================
   Lyftora — Landing Page Scripts
   ============================================ */

// ---------- Custom cursor — extra hover targets ----------
if (window._cursorHover) {
  window._cursorHover('.food-card-2, .b-card, .phone-3d');
}

// ---------- Magnetic buttons ----------
document.querySelectorAll('[data-magnet]').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${mx * 0.2}px, ${my * 0.3}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// ---------- Counters ----------
function animateCounter(el) {
  const target = parseFloat(el.dataset.counter);
  const suffix = el.dataset.suffix || '';
  const dur = 1800;
  const start = performance.now();
  function step(t) {
    const p = Math.min(1, (t - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(target * eased);
    el.textContent = val.toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const cio = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); } });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-counter]').forEach(el => cio.observe(el));

// ---------- Tap-the-coin ----------
(() => {
  const btn = document.getElementById('coin-btn');
  const count = document.getElementById('coin-count');
  if (!btn || !count) return;
  let n = 0;
  btn.addEventListener('click', (e) => {
    n++;
    count.textContent = (n * 499).toLocaleString();
    const c = document.createElement('span');
    c.textContent = '+\u20B9499';
    c.style.position = 'fixed';
    c.style.left = e.clientX + 'px';
    c.style.top = e.clientY + 'px';
    c.style.font = '600 14px var(--sans)';
    c.style.color = 'var(--coral)';
    c.style.pointerEvents = 'none';
    c.style.zIndex = 9999;
    c.style.transition = 'transform .9s ease-out, opacity .9s';
    document.body.appendChild(c);
    requestAnimationFrame(() => {
      c.style.transform = `translate(${(Math.random() - .5) * 80}px, -80px)`;
      c.style.opacity = '0';
    });
    setTimeout(() => c.remove(), 900);
  });
})();

// ---------- Rep counter ----------
(() => {
  const btn = document.getElementById('rep-btn');
  const num = document.getElementById('rep-num');
  if (!btn || !num) return;
  let r = 0;
  const tick = () => {
    r++;
    num.textContent = r;
    num.classList.add('bump');
    setTimeout(() => num.classList.remove('bump'), 140);
  };
  btn.addEventListener('click', tick);
  const repCard = document.querySelector('.rep-card');
  if (repCard) {
    repCard.addEventListener('click', (e) => {
      if (e.target === btn) return;
      tick();
    });
  }
})();

// ---------- Years comparison ----------
(() => {
  const apps = [
    { name: 'HealthifyMe', note: '\u20B9499/mo', monthly: 499, once: false },
    { name: 'Hevy Pro',    note: '$9.99/mo',     monthly: 830, once: false },
    { name: 'MyFitnessPal', note: '$9.99/mo',    monthly: 830, once: false },
    { name: 'Cult.fit',    note: '\u20B9999/mo',  monthly: 999, once: false },
    { name: 'Lyftora',     note: 'once',          monthly: 0,   once: true, total: 499, win: true }
  ];
  const chart = document.getElementById('cmp-chart');
  const yearPills = document.querySelectorAll('.years-pill');
  if (!chart) return;
  let years = 5;

  function render() {
    const data = apps.map(a => ({
      ...a,
      total: a.once ? 499 : a.monthly * 12 * years
    }));
    const max = Math.max(...data.map(d => d.total));
    chart.innerHTML = data.map(d => `
      <div class="cmp-row ${d.win ? 'win' : ''}" style="--w:${(d.total / max) * 100}%">
        <div class="cmp-app">${d.name}<small>${d.note}</small></div>
        <div class="cmp-track"><div class="cmp-bar"></div></div>
        <div class="cmp-cost">\u20B9${d.total.toLocaleString()}</div>
      </div>
    `).join('');
    requestAnimationFrame(() => {
      chart.querySelectorAll('.cmp-row').forEach(r => r.classList.add('is-visible'));
    });
  }

  yearPills.forEach(p => {
    p.addEventListener('click', () => {
      yearPills.forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      years = parseInt(p.dataset.years, 10);
      render();
    });
  });

  const chartObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { render(); chartObs.disconnect(); } });
  }, { rootMargin: '0px 0px -15% 0px' });
  chartObs.observe(chart);
})();

// ---------- Plate builder ----------
(() => {
  const ingredients = [
    { id: 'rice',    emoji: '\uD83C\uDF5A', nm: 'White rice',      kc: 210, p: 4,  c: 45, f: 1,  color: '#F5ECD9' },
    { id: 'dal',     emoji: '\uD83E\uDD63', nm: 'Dal tadka',         kc: 180, p: 9,  c: 22, f: 6,  color: '#F2B84A' },
    { id: 'roti',    emoji: '\uD83E\uDED3', nm: 'Whole wheat roti',  kc: 120, p: 4,  c: 22, f: 2,  color: '#D8B27A' },
    { id: 'paneer',  emoji: '\uD83E\uDDC0', nm: 'Paneer curry',     kc: 260, p: 14, c: 8,  f: 20, color: '#FFD27A' },
    { id: 'chicken', emoji: '\uD83C\uDF57', nm: 'Grilled chicken',   kc: 220, p: 32, c: 1,  f: 9,  color: '#C98B5E' },
    { id: 'dosa',    emoji: '\uD83E\uDD5E', nm: 'Masala dosa',       kc: 320, p: 8,  c: 48, f: 10, color: '#E9C98C' },
    { id: 'egg',     emoji: '\uD83C\uDF73', nm: 'Omelette (2)',          kc: 160, p: 12, c: 2,  f: 11, color: '#F2D06B' },
    { id: 'salad',   emoji: '\uD83E\uDD57', nm: 'Salad',         kc: 40,  p: 2,  c: 8,  f: 1,  color: '#9CCB5A' },
    { id: 'yogurt',  emoji: '\uD83E\uDD5B', nm: 'Yogurt',              kc: 90,  p: 6,  c: 8,  f: 4,  color: '#EDE7D1' },
    { id: 'fruit',   emoji: '\uD83C\uDF4A', nm: 'Seasonal fruit',    kc: 80,  p: 1,  c: 20, f: 0,  color: '#FF9E5C' },
    { id: 'nuts',    emoji: '\uD83E\uDD5C', nm: 'Almonds (10)',      kc: 70,  p: 3,  c: 2,  f: 6,  color: '#B88A5E' },
    { id: 'poha',    emoji: '\uD83C\uDF5B', nm: 'Poha',              kc: 230, p: 5,  c: 40, f: 6,  color: '#F4C95A' }
  ];

  const grid = document.getElementById('ing-grid');
  if (!grid) return;
  const stage = document.getElementById('plate-stage');
  const itemsWrap = document.getElementById('plate-items');
  const kcalN = document.getElementById('kcal-n');
  const mP = document.getElementById('m-p'), mC = document.getElementById('m-c'), mF = document.getElementById('m-f');
  const fP = document.getElementById('f-p'), fC = document.getElementById('f-c'), fF = document.getElementById('f-f');
  const rP = document.getElementById('ring-p'), rC = document.getElementById('ring-c'), rF = document.getElementById('ring-f');
  const clrBtn = document.getElementById('clr-plate');
  const saveBtn = document.getElementById('save-meal');
  const savedToast = document.getElementById('saved-toast');
  const mealBtns = document.querySelectorAll('.meal-pill button');

  let selected = {};
  let currentMeal = 'Breakfast';

  grid.innerHTML = ingredients.map(i => `
    <button class="ing" data-id="${i.id}">
      <span class="count">0</span>
      <span class="pulse"></span>
      <span class="emoji">${i.emoji}</span>
      <span class="nm">${i.nm}</span>
      <span class="kc">${i.kc} kcal \u00B7 P${i.p} C${i.c} F${i.f}</span>
    </button>
  `).join('');

  const byId = Object.fromEntries(ingredients.map(i => [i.id, i]));

  function flyChip(fromEl, ing) {
    const stageRect = stage.getBoundingClientRect();
    const fromRect = fromEl.getBoundingClientRect();
    const fx = fromRect.left + fromRect.width / 2 - (stageRect.left + stageRect.width / 2);
    const fy = fromRect.top + fromRect.height / 2 - (stageRect.top + stageRect.height / 2);
    const chip = document.createElement('div');
    chip.className = 'chip-fly';
    chip.textContent = ing.emoji;
    chip.style.setProperty('--fx', fx + 'px');
    chip.style.setProperty('--fy', fy + 'px');
    const rot = (Math.random() * 40 - 20);
    chip.style.setProperty('--fr', rot + 'deg');
    const angle = Math.random() * Math.PI * 2;
    const r = 70 + Math.random() * 70;
    const lx = Math.cos(angle) * r;
    const ly = Math.sin(angle) * r;
    chip.style.left = `calc(50% + ${lx}px - 26px)`;
    chip.style.top  = `calc(50% + ${ly}px - 26px)`;
    stage.appendChild(chip);

    const blob = document.createElement('div');
    blob.className = 'blob';
    const size = 60 + Math.random() * 40;
    blob.style.width = size + 'px';
    blob.style.height = size + 'px';
    blob.style.background = ing.color;
    blob.style.left = `calc(50% + ${lx * 0.9}px - ${size / 2}px)`;
    blob.style.top = `calc(50% + ${ly * 0.9}px - ${size / 2}px)`;
    itemsWrap.appendChild(blob);

    setTimeout(() => chip.remove(), 900);
  }

  function totals() {
    let kcal = 0, p = 0, c = 0, f = 0;
    for (const id in selected) {
      const n = selected[id]; const ing = byId[id];
      kcal += ing.kc * n; p += ing.p * n; c += ing.c * n; f += ing.f * n;
    }
    return { kcal, p, c, f };
  }

  function animate(el, to) {
    const from = parseInt(el.textContent, 10) || 0;
    const dur = 500; const s = performance.now();
    function step(t) {
      const pr = Math.min(1, (t - s) / dur);
      const e = 1 - Math.pow(1 - pr, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (pr < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function render() {
    const t = totals();
    animate(kcalN, t.kcal);
    animate(mP, t.p); animate(mC, t.c); animate(mF, t.f);
    fP.style.width = Math.min(100, t.p / 40 * 100) + '%';
    fC.style.width = Math.min(100, t.c / 75 * 100) + '%';
    fF.style.width = Math.min(100, t.f / 25 * 100) + '%';
    const pct = Math.min(1, t.kcal / 600);
    rP.setAttribute('stroke-dasharray', `${pct * 289} 289`);
    rC.setAttribute('stroke-dasharray', `${Math.min(1, t.p / 40) * 264} 264`);
    rF.setAttribute('stroke-dasharray', `${Math.min(1, t.c / 75) * 239} 239`);
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.ing');
    if (!btn) return;
    const id = btn.dataset.id;
    const ing = byId[id];
    selected[id] = (selected[id] || 0) + 1;
    btn.classList.add('added', 'just');
    btn.querySelector('.count').textContent = selected[id];
    setTimeout(() => btn.classList.remove('just'), 600);
    flyChip(btn, ing);
    render();
  });

  clrBtn.addEventListener('click', () => {
    selected = {};
    itemsWrap.innerHTML = '';
    document.querySelectorAll('.ing').forEach(b => { b.classList.remove('added'); b.querySelector('.count').textContent = '0'; });
    stage.classList.add('spin');
    setTimeout(() => stage.classList.remove('spin'), 800);
    render();
  });

  saveBtn.addEventListener('click', () => {
    const t = totals();
    if (t.kcal === 0) return;
    savedToast.textContent = `Logged to ${currentMeal} \u00B7 ${t.kcal} kcal \u2713`;
    savedToast.classList.add('show');
    setTimeout(() => savedToast.classList.remove('show'), 2200);
    stage.classList.add('spin');
    setTimeout(() => {
      stage.classList.remove('spin');
      selected = {}; itemsWrap.innerHTML = '';
      document.querySelectorAll('.ing').forEach(b => { b.classList.remove('added'); b.querySelector('.count').textContent = '0'; });
      render();
    }, 900);
  });

  mealBtns.forEach(b => b.addEventListener('click', () => {
    mealBtns.forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    currentMeal = b.dataset.meal;
  }));

  render();
})();

// ---------- Phone 3D tilt ----------
(() => {
  const el = document.getElementById('phone3d');
  if (!el) return;
  const wrap = el.parentElement;
  wrap.addEventListener('mousemove', (e) => {
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 12}deg)`;
  });
  wrap.addEventListener('mouseleave', () => {
    el.style.transform = 'rotateY(0) rotateX(0)';
  });
})();

// ---------- Chat send ----------
(() => {
  const input = document.getElementById('coach-input');
  const send = document.getElementById('coach-send');
  const box = document.querySelector('.chat-box');
  if (!send || !input || !box) return;
  send.addEventListener('click', () => {
    const v = input.value.trim();
    if (!v) return;
    const typing = box.querySelector('.bb.typing');
    const me = document.createElement('div');
    me.className = 'bb user';
    me.textContent = v;
    box.insertBefore(me, typing);
    input.value = '';
    setTimeout(() => {
      const reply = document.createElement('div');
      reply.className = 'bb coach';
      reply.textContent = "Logged. Let\u2019s build a week around that \u2014 I\u2019ll queue the plan in your inbox.";
      box.insertBefore(reply, typing);
    }, 900);
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send.click(); });
})();

// ---------- Confetti on download ----------
function confetti(x, y) {
  const wrap = document.createElement('div');
  wrap.className = 'confetti';
  document.body.appendChild(wrap);
  const colors = ['#D6FF4D', '#FF5A3C', '#7B5CFF', '#6EE0FF', '#0E0E12'];
  for (let k = 0; k < 50; k++) {
    const s = document.createElement('span');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.background = colors[k % colors.length];
    s.style.setProperty('--dx', ((Math.random() - 0.5) * 400) + 'px');
    s.style.setProperty('--dy', (Math.random() * -400 - 60) + 'px');
    s.style.animationDelay = (Math.random() * 0.15) + 's';
    s.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    wrap.appendChild(s);
  }
  setTimeout(() => wrap.remove(), 2200);
}
document.querySelectorAll('.btn-primary, #buy-btn').forEach(b => {
  b.addEventListener('click', (e) => {
    confetti(e.clientX, e.clientY);
  });
});

// ---------- Price number scramble on hover ----------
(() => {
  const el = document.getElementById('price-num');
  if (!el) return;
  const final = '499';
  let timer;
  el.addEventListener('mouseenter', () => {
    let n = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      el.textContent = String(Math.floor(Math.random() * 900) + 100);
      n++;
      if (n > 8) { clearInterval(timer); el.textContent = final; }
    }, 50);
  });
})();

/* ── Waitlist form — wired to /api/waitlist + Resend ── */
(() => {
  const forms = document.querySelectorAll('.waitlist-form');
  if (!forms.length) return;

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value.trim());
  }

  function setError(input, form, status, msg) {
    input.classList.add('is-error');
    form.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    if (status) {
      status.textContent = msg;
      status.classList.remove('is-success');
      status.classList.add('is-error');
    }
  }

  function clearError(input, form, status) {
    input.classList.remove('is-error');
    form.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
    if (status) {
      status.textContent = '';
      status.classList.remove('is-error');
    }
  }

  function showSuccess(wrapper, email) {
    wrapper.classList.add('is-submitted');

    /* Inject success card if not already present */
    if (!wrapper.querySelector('.waitlist-success')) {
      const card = document.createElement('div');
      card.className = 'waitlist-success';
      card.setAttribute('role', 'status');
      card.setAttribute('aria-live', 'polite');
      card.innerHTML = `
        <div class="waitlist-success__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
               stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="11"/>
            <polyline class="check-path" points="5,12 10,17 19,7"/>
          </svg>
        </div>
        <p class="waitlist-success__headline">You're on the list!</p>
        <p class="waitlist-success__sub">We'll reach out to <strong>${email}</strong> when we launch.</p>
      `;
      wrapper.appendChild(card);
    }
  }

  forms.forEach(form => {
    const wrapper = form.closest('.waitlist');
    const input   = form.querySelector('input[name="email"]');
    const status  = wrapper ? wrapper.querySelector('.waitlist-status') : null;
    const btn     = form.querySelector('button[type="submit"]');

    input.addEventListener('input', () => clearError(input, form, status));

    input.addEventListener('blur', () => {
      const val = input.value.trim();
      if (val && !isValidEmail(val)) {
        setError(input, form, status, 'Please enter a valid email address.');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();

      if (!email) {
        setError(input, form, status, 'Email address is required.');
        input.focus();
        return;
      }
      if (!isValidEmail(email)) {
        setError(input, form, status, 'Please enter a valid email address.');
        input.focus();
        return;
      }

      clearError(input, form, status);

      /* Loading state */
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = '<span class="waitlist-spinner" aria-hidden="true"></span>Sending…';

      try {
        const res = await fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong. Please try again.');
        }

        /* Success */
        if (wrapper) showSuccess(wrapper, email);
        form.reset();

      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = btn.dataset.originalText;
        setError(input, form, status, err.message || 'Something went wrong. Please try again.');
      }
    });
  });
})();
