(function () {
  const root = document.documentElement;
  let toastTimer;
  function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }
  const THEME_KEY = 'hp-glass-theme';
  const mqMobile = window.matchMedia('(max-width: 860px)');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  /* ---------- Theme (ngày / đêm) ---------- */
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
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  /* ---------- Windows ---------- */
  const wins = $$('.win');
  const scrim = $('.scrim');
  let topZ = 10;

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
      b.classList.toggle('is-open', !!w && w.classList.contains('is-open'));
    });
  }
  function openWin(win) {
    if (mqMobile.matches) wins.forEach(w => w !== win && w.classList.remove('is-open'));
    win.classList.add('is-open');
    if (!win.dataset.placed && !mqMobile.matches) {
      const [x, y] = defaultPos(win, wins.indexOf(win) - 2);
      win.style.left = x + 'px'; win.style.top = y + 'px';
      win.dataset.placed = '1';
    }
    focusWin(win);
    scrim.classList.toggle('show', mqMobile.matches);
    syncDock();
  }
  function closeWin(win) {
    win.classList.remove('is-open', 'is-focused');
    if (!wins.some(w => w.classList.contains('is-open'))) scrim.classList.remove('show');
    syncDock();
  }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const win = $('#win-' + btn.dataset.open);
    if (!win) return;
    const isTop = win.classList.contains('is-focused');
    if (win.classList.contains('is-open') && isTop && btn.classList.contains('dock-item')) closeWin(win);
    else openWin(win);
  }));
  $$('.l-close').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); closeWin(b.closest('.win')); }));
  scrim.addEventListener('click', () => wins.forEach(closeWin));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const top = wins.filter(w => w.classList.contains('is-open')).sort((a, b) => (b.style.zIndex | 0) - (a.style.zIndex | 0))[0];
    if (top) closeWin(top);
  });
  wins.forEach(win => win.addEventListener('pointerdown', () => focusWin(win)));

  /* Drag (desktop) */
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

  function initLayout() {
    wins.forEach(w => w.classList.remove('is-open', 'is-focused'));
    scrim.classList.remove('show');
    if (!mqMobile.matches) ['win-skills', 'win-exp', 'win-about'].forEach(id => openWin($('#' + id)));
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
