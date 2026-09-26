(function () {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const mqMobile = window.matchMedia('(max-width: 860px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.2,.8,.2,1)';

  let toastTimer;
  function showToast(msg) {
    const toast = $('#toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  /* ---------- Theme (ngày / đêm) + vòng lan ---------- */
  const THEME_KEY = 'hp-glass-theme';
  const themeBtn = $('#themeToggle');
  const metaTheme = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    themeBtn.setAttribute('aria-pressed', t === 'dark');
    themeBtn.title = t === 'dark' ? 'Chuyển sang giao diện ngày' : 'Chuyển sang giao diện đêm';
    if (metaTheme) metaTheme.content = t === 'dark' ? '#0a0f14' : '#eef2f5';
  }
  applyTheme(root.getAttribute('data-theme') || 'light');
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const commit = () => { applyTheme(next); try { localStorage.setItem(THEME_KEY, next); } catch (e) {} };
    if (!document.startViewTransition || reduce.matches) return commit();
    const r = themeBtn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    const t = document.startViewTransition(commit);
    t.ready.then(() => root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
    ));
    t.finished.finally(() => root.classList.remove('vt-theme'));
  });

  /* ---------- Ánh sáng theo chuột trên kính ---------- */
  let raf = 0, lastEv = null;
  document.addEventListener('pointermove', e => {
    lastEv = e;
    if (raf || reduce.matches) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const g = lastEv.target.closest && lastEv.target.closest('.glass');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', lastEv.clientX - r.left + 'px');
      g.style.setProperty('--my', lastEv.clientY - r.top + 'px');
    });
  }, { passive: true });

  /* ---------- Số liệu đếm lên ---------- */
  function countUp(scope, delay = 0) {
    $$('[data-count]', scope).forEach(el => {
      const to = +el.dataset.count, suf = el.dataset.suffix || '';
      if (reduce.matches) { el.textContent = to + suf; return; }
      const t0 = performance.now() + delay, dur = 1200;
      el.textContent = '0' + suf;
      const step = now => {
        const p = Math.min(1, Math.max(0, (now - t0) / dur));
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- Windows ---------- */
  const wins = $$('.win');
  const scrim = $('.scrim');
  let topZ = 10;
  const keyOf = w => w.id.slice(4);
  const anyOpen = () => wins.some(w => w.classList.contains('is-open') && !w.dataset.closing);

  function defaultPos(win, i) {
    const vw = innerWidth, vh = innerHeight, pad = Math.max(24, vw * 0.04);
    const w = win.offsetWidth || 480;
    switch (win.id) {
      case 'win-about': return [pad, 64];
      case 'win-exp': return [vw - w - pad, 64];
      case 'win-skills': return [Math.max(pad, vw * 0.18), Math.max(96, vh - 470)];
      default: return [(vw - w) / 2 + i * 24, 90 + i * 24];
    }
  }
  function clamp(win) {
    const x = parseFloat(win.style.left) || 0, y = parseFloat(win.style.top) || 0;
    win.style.left = Math.min(Math.max(-win.offsetWidth + 120, x), innerWidth - 120) + 'px';
    win.style.top = Math.min(Math.max(44, y), innerHeight - 60) + 'px';
  }
  function focusWin(win) {
    wins.forEach(w => w.classList.remove('is-focused'));
    win.style.zIndex = ++topZ;
    win.classList.add('is-focused');
  }
  function syncDock() {
    $$('[data-open]').forEach(b => {
      const w = $('#win-' + b.dataset.open);
      b.classList.toggle('is-open', !!w && w.classList.contains('is-open') && !w.dataset.closing);
    });
  }

  /* Genie: vector từ tâm cửa sổ tới icon dock */
  function genieVector(win) {
    const ic = $(`.dock-item[data-open="${keyOf(win)}"] .app-icon`);
    if (!ic) return null;
    const a = win.getBoundingClientRect(), b = ic.getBoundingClientRect();
    return [b.left + b.width / 2 - (a.left + a.width / 2), b.top + b.height / 2 - (a.top + a.height / 2)];
  }
  const genieOut = (dx, dy) => [
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * .5}px, ${dy * .7}px) scale(.55, .28)`, opacity: .85, offset: .6 },
    { transform: `translate(${dx}px, ${dy}px) scale(.05)`, opacity: 0 }
  ];
  const genieIn = (dx, dy) => [
    { transform: `translate(${dx}px, ${dy}px) scale(.05)`, opacity: 0 },
    { transform: `translate(${dx * .5}px, ${dy * .7}px) scale(.55, .28)`, opacity: .85, offset: .4 },
    { transform: 'none', opacity: 1 }
  ];

  function hideNow(win) {
    win.getAnimations().forEach(a => a.cancel());
    win.classList.remove('is-open', 'is-focused');
    delete win.dataset.closing;
    win.style.transform = '';
  }

  function openWin(win, delay = 0) {
    win.getAnimations().forEach(a => a.cancel());
    delete win.dataset.closing;
    win.style.transform = '';
    const wasOpen = win.classList.contains('is-open');
    if (mqMobile.matches) wins.forEach(w => w !== win && hideNow(w));
    win.classList.add('is-open');
    if (!win.dataset.placed && !mqMobile.matches) {
      const [x, y] = defaultPos(win, wins.indexOf(win) - 2);
      win.style.left = x + 'px'; win.style.top = y + 'px';
      win.dataset.placed = '1';
    }
    focusWin(win);
    scrim.classList.toggle('show', mqMobile.matches);
    syncDock();
    if (wasOpen) return;
    if (!reduce.matches) {
      if (mqMobile.matches) {
        win.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(-6px)', offset: .75 }, { transform: 'none' }], { duration: 460, easing: EASE });
      } else {
        const v = genieVector(win);
        if (v) win.animate(genieIn(...v), { duration: 540, delay, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
      }
    }
    if (keyOf(win) === 'about') countUp(win, delay + 200);
  }

  function closeWin(win) {
    if (!win.classList.contains('is-open') || win.dataset.closing) return;
    const done = () => {
      hideNow(win);
      if (!anyOpen()) scrim.classList.remove('show');
      syncDock();
    };
    if (reduce.matches) return done();
    win.dataset.closing = '1';
    syncDock();
    let anim;
    if (mqMobile.matches) {
      scrim.classList.remove('show');
      anim = win.animate([{ transform: win.style.transform || 'none' }, { transform: 'translateY(105%)' }], { duration: 300, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    } else {
      const v = genieVector(win);
      if (!v) return done();
      anim = win.animate(genieOut(...v), { duration: 500, easing: 'cubic-bezier(.55,0,.75,.2)', fill: 'forwards' });
    }
    anim.onfinish = done;
  }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const win = $('#win-' + btn.dataset.open);
    if (!win) return;
    const open = win.classList.contains('is-open') && !win.dataset.closing;
    if (open && win.classList.contains('is-focused') && btn.classList.contains('dock-item')) closeWin(win);
    else openWin(win);
  }));
  $$('.l-close').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); closeWin(b.closest('.win')); }));
  scrim.addEventListener('click', () => wins.forEach(closeWin));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const top = wins.filter(w => w.classList.contains('is-open') && !w.dataset.closing)
      .sort((a, b) => (b.style.zIndex | 0) - (a.style.zIndex | 0))[0];
    if (top) closeWin(top);
  });
  wins.forEach(win => win.addEventListener('pointerdown', () => focusWin(win)));

  /* Kéo cửa sổ (desktop) */
  wins.forEach(win => {
    const bar = $('.win-bar', win);
    bar.addEventListener('pointerdown', e => {
      if (mqMobile.matches || e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY;
      const ox = parseFloat(win.style.left) || 0, oy = parseFloat(win.style.top) || 0;
      bar.setPointerCapture(e.pointerId);
      const move = ev => {
        win.style.left = ox + ev.clientX - sx + 'px';
        win.style.top = oy + ev.clientY - sy + 'px';
        clamp(win);
      };
      const up = () => { bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });
  });

  /* Vuốt xuống để đóng sheet (mobile) */
  wins.forEach(win => {
    const grab = document.createElement('span');
    grab.className = 'grabber';
    grab.setAttribute('aria-hidden', 'true');
    win.prepend(grab);
    [grab, $('.win-bar', win)].forEach(h => h.addEventListener('pointerdown', e => {
      if (!mqMobile.matches || e.target.closest('button')) return;
      const sy = e.clientY, t0 = performance.now();
      let dy = 0;
      h.setPointerCapture(e.pointerId);
      const move = ev => {
        const raw = ev.clientY - sy;
        dy = raw > 0 ? raw : raw / 6;
        win.style.transform = `translateY(${dy}px)`;
        scrim.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / 420));
      };
      const up = () => {
        h.removeEventListener('pointermove', move);
        h.removeEventListener('pointerup', up);
        h.removeEventListener('pointercancel', up);
        scrim.style.opacity = '';
        const v = dy / Math.max(1, performance.now() - t0);
        if (dy > 110 || v > .6) { closeWin(win); return; }
        if (dy !== 0 && !reduce.matches) {
          win.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(-5px)', offset: .7 }, { transform: 'none' }], { duration: 380, easing: EASE });
        }
        win.style.transform = '';
      };
      h.addEventListener('pointermove', move);
      h.addEventListener('pointerup', up);
      h.addEventListener('pointercancel', up);
    }));
  });

  /* ---------- Dock phóng to kiểu macOS ---------- */
  const dock = $('.dock');
  const dockItems = $$('.dock-item');
  if (dock) {
    dock.addEventListener('pointermove', e => {
      if (reduce.matches || e.pointerType === 'touch') return;
      dockItems.forEach(it => {
        const r = it.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        it.style.setProperty('--s', (1 + .55 * Math.max(0, 1 - d / 140)).toFixed(3));
      });
    });
    dock.addEventListener('pointerleave', () => dockItems.forEach(it => it.style.setProperty('--s', 1)));
  }

  /* ---------- Khởi tạo ---------- */
  function initLayout() {
    wins.forEach(hideNow);
    scrim.classList.remove('show');
    if (!mqMobile.matches) {
      ['win-skills', 'win-exp', 'win-about'].forEach((id, i) => openWin($('#' + id), 150 + i * 140));
    }
    syncDock();
  }
  initLayout();
  mqMobile.addEventListener('change', initLayout);
  addEventListener('resize', () => { if (!mqMobile.matches) wins.forEach(clamp); });

  /* ---------- Clock ---------- */
  const clock = $('#clock');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function tick() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    clock.textContent = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  tick(); setInterval(tick, 20000);

  /* ---------- Print & copy ---------- */
  $('#btnPrintCV').addEventListener('click', () => window.print());
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); showToast('Đã sao chép số điện thoại'); }
    catch (e) { showToast(b.dataset.copy); }
  }));
})();
