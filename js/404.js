(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const lines = [
    { t: '12:04:21', el: 'm1', text: 'request ' + (location.pathname || '/unknown-rep') },
    { t: '12:04:21', el: 'm2', text: 'no route registered for that URL' },
    { t: '12:04:21', el: 'm3', text: 'router.match() returned null · falling back to /404' },
    { t: '12:04:22', el: 'm4', text: 'rendering recovery options · 4 suggestions queued' },
    { t: '12:04:22', el: 'm5', text: 'Coach AI is still up. Get back to lifting.' },
  ];

  ['t1', 't2', 't3', 't4', 't5'].forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = lines[i].t;
  });

  if (reduced) {
    lines.forEach(l => {
      const el = document.getElementById(l.el);
      if (el) el.textContent = l.text;
    });
    return;
  }

  let delay = 220;
  lines.forEach(l => {
    const el = document.getElementById(l.el);
    if (!el) return;
    setTimeout(() => {
      let i = 0;
      (function type() {
        if (i < l.text.length) {
          el.textContent += l.text[i++];
          setTimeout(type, 16 + Math.random() * 30);
        }
      })();
    }, delay);
    delay += 220 + l.text.length * 22;
  });
})();
