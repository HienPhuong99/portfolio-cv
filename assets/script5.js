(function () {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const mqMobile = window.matchMedia('(max-width: 860px)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Spring easing (CSS linear()) ----------
     Mô phỏng lò xo tắt dần, lấy mẫu thành linear() để chạy trên compositor. */
  const hasLinear = window.CSS && CSS.supports('animation-timing-function', 'linear(0, 1)');
  function spring(stiffness, damping, fallback, fallbackMs) {
    if (!hasLinear) return { easing: fallback, duration: fallbackMs };
    const w0 = Math.sqrt(stiffness), z = damping / (2 * Math.sqrt(stiffness));
    const wd = w0 * Math.sqrt(Math.max(1e-6, 1 - z * z));
    const f = t => z < 1
      ? 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t))
      : 1 - Math.exp(-w0 * t) * (1 + w0 * t);
    let settle = 0;
    for (let t = 0; t < 4; t += 1 / 240) if (Math.abs(f(t) - 1) > 0.002) settle = t;
    settle = Math.max(settle, 0.2);
    const pts = [];
    for (let i = 0; i <= 64; i++) pts.push(+f((i / 64) * settle).toFixed(4));
    pts[64] = 1;
    return { easing: `linear(${pts.join(', ')})`, duration: Math.round(settle * 1000) };
  }
  const SPRING = spring(230, 26, 'cubic-bezier(.2,.9,.3,1)', 480);          // mượt, gần như không nảy
  const SPRING_BOUNCE = spring(300, 22, 'cubic-bezier(.2,1.2,.4,1)', 520);  // nảy nhẹ kiểu iOS
  const SPRING_SNAPPY = spring(420, 34, 'cubic-bezier(.2,.9,.3,1)', 320);

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

  /* ---------- Độ trong suốt ---------- */
  const CLEAR_KEY = 'hp-glass-clear';
  const clearBtn = $('#clearBtn'), clearPop = $('#clearPop'), clearRange = $('#clearRange'), clearVal = $('#clearVal');
  const presets = $$('[data-clear]');
  function setClear(v, save) {
    v = Math.max(0, Math.min(100, Math.round(v)));
    root.style.setProperty('--clear', (v / 100).toFixed(2));
    clearRange.value = v;
    clearRange.style.setProperty('--fill', v + '%');
    clearVal.textContent = v + '%';
    presets.forEach(p => p.setAttribute('aria-pressed', +p.dataset.clear === v));
    if (save) { try { localStorage.setItem(CLEAR_KEY, v); } catch (e) {} }
  }
  setClear(Math.round(parseFloat(getComputedStyle(root).getPropertyValue('--clear')) * 100) || 45);
  clearRange.addEventListener('input', () => {
    let v = +clearRange.value;
    const snap = presets.map(p => +p.dataset.clear).find(p => Math.abs(p - v) <= 2);
    if (snap !== undefined && snap !== v) { v = snap; if (navigator.vibrate) navigator.vibrate(6); }
    setClear(v, true);
  });
  presets.forEach(p => p.addEventListener('click', () => setClear(+p.dataset.clear, true)));
  const togglePop = open => {
    clearPop.classList.toggle('open', open);
    clearBtn.setAttribute('aria-expanded', open);
  };
  clearBtn.addEventListener('click', e => { e.stopPropagation(); togglePop(!clearPop.classList.contains('open')); });
  clearBtn.addEventListener('pointerdown', e => e.stopPropagation());
  clearPop.addEventListener('pointerdown', e => e.stopPropagation());
  document.addEventListener('pointerdown', () => togglePop(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && clearPop.classList.contains('open')) { e.stopImmediatePropagation(); togglePop(false); clearBtn.focus(); } }, true);

  /* ---------- Ánh sáng theo chuột trên kính ---------- */
  let glowRaf = 0, lastEv = null;
  document.addEventListener('pointermove', e => {
    lastEv = e;
    if (glowRaf || reduce.matches || e.pointerType === 'touch') return;
    glowRaf = requestAnimationFrame(() => {
      glowRaf = 0;
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
  const isOpen = w => w.classList.contains('is-open') && !w.dataset.closing;
  const anyOpen = () => wins.some(isOpen);
  const ZOOM = { l: 16, t: 52, b: 104 };

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
  function clampXY(win, x, y) {
    return [
      Math.min(Math.max(-win.offsetWidth + 120, x), innerWidth - 120),
      Math.min(Math.max(44, y), innerHeight - 60)
    ];
  }
  function clamp(win) {
    const [x, y] = clampXY(win, parseFloat(win.style.left) || 0, parseFloat(win.style.top) || 0);
    win.style.left = x + 'px'; win.style.top = y + 'px';
  }
  function focusWin(win) {
    wins.forEach(w => w.classList.remove('is-focused'));
    win.style.zIndex = ++topZ;
    win.classList.add('is-focused');
  }
  function focusTopRemaining() {
    const top = wins.filter(isOpen).sort((a, b) => (b.style.zIndex | 0) - (a.style.zIndex | 0))[0];
    if (top) focusWin(top);
  }
  function syncDock() {
    $$('[data-open]').forEach(b => {
      const w = $('#win-' + b.dataset.open);
      b.classList.toggle('is-open', !!w && (isOpen(w) || w.dataset.min === '1'));
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
    { transform: `translate3d(${dx * .5}px, ${dy * .7}px, 0) scale(.55, .28)`, opacity: .85, offset: .6 },
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(.05)`, opacity: 0 }
  ];
  const genieIn = (dx, dy) => [
    { transform: `translate3d(${dx}px, ${dy}px, 0) scale(.05)`, opacity: 0 },
    { transform: `translate3d(${dx * .5}px, ${dy * .7}px, 0) scale(.55, .28)`, opacity: .85, offset: .35 },
    { transform: 'none', opacity: 1 }
  ];
  function run(win, frames, opts) {
    win.classList.add('is-animating');
    const a = win.animate(frames, opts);
    const clear = () => win.classList.remove('is-animating');
    a.addEventListener('finish', clear);
    a.addEventListener('cancel', clear);
    return a;
  }

  function hideNow(win) {
    win.getAnimations().forEach(a => a.cancel());
    win.classList.remove('is-open', 'is-focused');
    delete win.dataset.closing;
    delete win.dataset.min;
    win.style.transform = '';
  }

  function openWin(win, delay = 0) {
    win.getAnimations().forEach(a => a.cancel());
    const restoring = win.dataset.min === '1';
    const wasOpen = isOpen(win);
    delete win.dataset.closing;
    delete win.dataset.min;
    win.style.transform = '';
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
        run(win, [{ transform: 'translate3d(0, 100%, 0)' }, { transform: 'none' }], { duration: SPRING_BOUNCE.duration, easing: SPRING_BOUNCE.easing });
      } else {
        const v = genieVector(win);
        if (v) run(win, genieIn(...v), { duration: Math.max(520, SPRING.duration), delay, easing: SPRING.easing, fill: 'backwards' });
      }
    }
    if (keyOf(win) === 'about' && !restoring) countUp(win, delay + 200);
  }

  function closeWin(win, velocity = 0) {
    if (!isOpen(win)) return;
    const done = () => {
      hideNow(win);
      if (!anyOpen()) scrim.classList.remove('show');
      syncDock();
      focusTopRemaining();
    };
    if (reduce.matches) return done();
    win.dataset.closing = '1';
    syncDock();
    let anim;
    if (mqMobile.matches) {
      scrim.classList.remove('show');
      const cur = new DOMMatrix(getComputedStyle(win).transform).m42 || 0;
      const remaining = win.offsetHeight * 1.05 - cur;
      const dur = Math.min(340, Math.max(170, remaining / Math.max(velocity, 1.6)));
      anim = run(win, [{ transform: `translate3d(0, ${cur}px, 0)` }, { transform: 'translate3d(0, 105%, 0)' }], { duration: dur, easing: velocity ? 'cubic-bezier(.2,.6,.4,1)' : 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
    } else {
      const v = genieVector(win);
      if (!v) return done();
      anim = run(win, genieOut(...v), { duration: 480, easing: 'cubic-bezier(.55,0,.75,.2)', fill: 'forwards' });
    }
    anim.onfinish = done;
  }

  /* Nút vàng: thu nhỏ xuống dock (vẫn giữ chấm trên dock) */
  function minimizeWin(win) {
    if (!isOpen(win) || mqMobile.matches) return;
    const done = () => {
      win.getAnimations().forEach(a => a.cancel());
      win.classList.remove('is-open', 'is-focused');
      delete win.dataset.closing;
      win.dataset.min = '1';
      syncDock();
      focusTopRemaining();
    };
    if (reduce.matches) return done();
    const v = genieVector(win);
    if (!v) return done();
    win.dataset.closing = '1';
    run(win, genieOut(...v), { duration: 560, easing: 'cubic-bezier(.55,0,.7,.25)', fill: 'forwards' }).onfinish = done;
  }

  /* Nút xanh: phóng to / trả về (FLIP + spring) */
  function zoomRect() {
    return { l: ZOOM.l, t: ZOOM.t, w: innerWidth - ZOOM.l * 2, h: innerHeight - ZOOM.t - ZOOM.b };
  }
  function flip(win, mutate) {
    const a = win.getBoundingClientRect();
    mutate();
    const b = win.getBoundingClientRect();
    if (reduce.matches) return;
    run(win, [
      { transformOrigin: '0 0', transform: `translate3d(${a.left - b.left}px, ${a.top - b.top}px, 0) scale(${a.width / b.width}, ${a.height / b.height})` },
      { transformOrigin: '0 0', transform: 'none' }
    ], { duration: SPRING.duration, easing: SPRING.easing });
  }
  function setZoomed(win, on, animate = true) {
    const apply = () => {
      if (on) {
        win.dataset.prev = JSON.stringify({ l: win.style.left, t: win.style.top });
        const z = zoomRect();
        win.classList.add('is-zoomed');
        Object.assign(win.style, { left: z.l + 'px', top: z.t + 'px', width: z.w + 'px', height: z.h + 'px' });
      } else {
        const p = JSON.parse(win.dataset.prev || '{}');
        win.classList.remove('is-zoomed');
        Object.assign(win.style, { left: p.l || win.style.left, top: p.t || win.style.top, width: '', height: '' });
      }
    };
    animate ? flip(win, apply) : apply();
  }
  function toggleZoom(win) {
    if (mqMobile.matches) return;
    win.getAnimations().forEach(a => a.cancel());
    setZoomed(win, !win.classList.contains('is-zoomed'));
    focusWin(win);
  }

  $$('[data-open]').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault();
    const win = $('#win-' + btn.dataset.open);
    if (!win) return;
    if (win.dataset.min === '1') return openWin(win);
    if (isOpen(win) && win.classList.contains('is-focused') && btn.classList.contains('dock-item')) minimizeWin(win);
    else openWin(win);
  }));
  $$('.l-close').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); closeWin(b.closest('.win')); }));
  $$('.l-min').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); minimizeWin(b.closest('.win')); }));
  $$('.l-max').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); toggleZoom(b.closest('.win')); }));
  $$('.win-bar').forEach(bar => bar.addEventListener('dblclick', e => {
    if (e.target.closest('button')) return;
    toggleZoom(bar.closest('.win'));
  }));
  scrim.addEventListener('click', () => wins.forEach(w => closeWin(w)));
  document.addEventListener('keydown', e => {
    const top = wins.filter(isOpen).sort((a, b) => (b.style.zIndex | 0) - (a.style.zIndex | 0))[0];
    if (!top) return;
    if (e.key === 'Escape') closeWin(top);
    else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') { e.preventDefault(); minimizeWin(top); }
  });
  wins.forEach(win => win.addEventListener('pointerdown', () => { if (!win.classList.contains('is-focused')) focusWin(win); }));

  /* Kéo cửa sổ (desktop) — chỉ đổi `translate` trong lúc kéo, chốt left/top khi thả */
  wins.forEach(win => {
    const bar = $('.win-bar', win);
    bar.addEventListener('pointerdown', e => {
      if (mqMobile.matches || e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      if (win.classList.contains('is-zoomed')) {
        const r = win.getBoundingClientRect();
        const ratio = (e.clientX - r.left) / r.width;
        setZoomed(win, false, false);
        win.style.left = e.clientX - ratio * win.offsetWidth + 'px';
        win.style.top = Math.max(44, e.clientY - 22) + 'px';
      }
      const sx = e.clientX, sy = e.clientY;
      const ox = parseFloat(win.style.left) || 0, oy = parseFloat(win.style.top) || 0;
      let px = sx, py = sy, raf = 0;
      bar.setPointerCapture(e.pointerId);
      win.classList.add('is-dragging');
      const paint = () => {
        raf = 0;
        const [x, y] = clampXY(win, ox + px - sx, oy + py - sy);
        win.style.translate = `${x - ox}px ${y - oy}px`;
      };
      const move = ev => { px = ev.clientX; py = ev.clientY; if (!raf) raf = requestAnimationFrame(paint); };
      const up = () => {
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
        cancelAnimationFrame(raf);
        const [x, y] = clampXY(win, ox + px - sx, oy + py - sy);
        win.style.translate = '';
        win.style.left = x + 'px'; win.style.top = y + 'px';
        win.classList.remove('is-dragging');
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
  });

  /* Vuốt xuống để đóng sheet (mobile) — bám tay 1:1, cao su khi kéo lên, spring khi thả */
  wins.forEach(win => {
    const grab = document.createElement('span');
    grab.className = 'grabber';
    grab.setAttribute('aria-hidden', 'true');
    win.prepend(grab);
    [grab, $('.win-bar', win)].forEach(h => h.addEventListener('pointerdown', e => {
      if (!mqMobile.matches || e.target.closest('button')) return;
      win.getAnimations().forEach(a => a.cancel());
      const sy = e.clientY;
      let dy = 0, raf = 0, lastY = sy, lastT = performance.now(), vel = 0;
      h.setPointerCapture(e.pointerId);
      win.classList.add('is-dragging');
      const paint = () => {
        raf = 0;
        win.style.transform = `translate3d(0, ${dy}px, 0)`;
        scrim.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / 420));
      };
      const move = ev => {
        const raw = ev.clientY - sy;
        dy = raw > 0 ? raw : -Math.pow(-raw, .7);
        const now = performance.now();
        vel = .8 * ((ev.clientY - lastY) / Math.max(1, now - lastT)) + .2 * vel;
        lastY = ev.clientY; lastT = now;
        if (!raf) raf = requestAnimationFrame(paint);
      };
      const up = () => {
        h.removeEventListener('pointermove', move);
        h.removeEventListener('pointerup', up);
        h.removeEventListener('pointercancel', up);
        cancelAnimationFrame(raf);
        win.classList.remove('is-dragging');
        scrim.style.opacity = '';
        if (dy > 120 || vel > .5) { win.style.transform = `translate3d(0, ${dy}px, 0)`; closeWin(win, Math.max(vel, 0)); return; }
        win.style.transform = '';
        if (dy !== 0 && !reduce.matches) {
          run(win, [{ transform: `translate3d(0, ${dy}px, 0)` }, { transform: 'none' }], { duration: SPRING_BOUNCE.duration, easing: SPRING_BOUNCE.easing });
        }
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
    let dockX = null, dockRaf = 0;
    const paintDock = () => {
      dockRaf = 0;
      if (dockX === null) { dockItems.forEach(it => it.style.setProperty('--s', 1)); return; }
      // Đọc hết vị trí trước rồi mới ghi --s: tránh ép layout lại sau mỗi icon
      const cx = dockItems.map(it => { const r = it.getBoundingClientRect(); return r.left + r.width / 2; });
      dockItems.forEach((it, i) => {
        const t = Math.max(0, 1 - Math.abs(dockX - cx[i]) / 150);
        it.style.setProperty('--s', (1 + .55 * t * t * (3 - 2 * t)).toFixed(3));
      });
    };
    dock.addEventListener('pointermove', e => {
      if (reduce.matches || e.pointerType === 'touch') return;
      dockX = e.clientX;
      if (!dockRaf) dockRaf = requestAnimationFrame(paintDock);
    });
    dock.addEventListener('pointerleave', () => { dockX = null; if (!dockRaf) dockRaf = requestAnimationFrame(paintDock); });
    dockItems.forEach(it => it.addEventListener('click', () => {
      if (reduce.matches) return;
      it.querySelector('.app-icon').animate(
        [{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }],
        { duration: 420, easing: 'cubic-bezier(.3,.7,.4,1)' }
      );
    }));
  }

  /* ---------- Khởi tạo ---------- */
  function initLayout() {
    wins.forEach(w => { hideNow(w); if (w.classList.contains('is-zoomed')) setZoomed(w, false, false); });
    scrim.classList.remove('show');
    if (!mqMobile.matches) {
      // Cửa sổ bật "Mở sẵn" trong Admin (Cửa sổ & Dock). Mở ngược thứ tự dock
      // để cửa sổ đứng đầu dock nằm trên cùng.
      wins.filter(w => w.dataset.openOnLoad === '1').reverse()
        .forEach((w, i) => openWin(w, 150 + i * 140));
    }
    syncDock();
  }
  initLayout();
  // Sau khi gửi form liên hệ (không qua AJAX), mở sẵn cửa sổ Liên hệ để thấy thông báo
  const initialWin = document.body.dataset.openInitial && $('#win-' + document.body.dataset.openInitial);
  if (initialWin) openWin(initialWin, mqMobile.matches ? 0 : 600);
  let lastMobile = mqMobile.matches;
  const checkMode = () => { if (mqMobile.matches !== lastMobile) { lastMobile = mqMobile.matches; initLayout(); } };
  mqMobile.addEventListener('change', checkMode);
  addEventListener('resize', () => {
    checkMode();
    if (mqMobile.matches) return;
    wins.forEach(w => {
      if (w.classList.contains('is-zoomed')) {
        const z = zoomRect();
        Object.assign(w.style, { width: z.w + 'px', height: z.h + 'px' });
      } else clamp(w);
    });
  });

  /* ---------- Clock ---------- */
  const clock = $('#clock');
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  function tick() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    clock.textContent = `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1} · ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  tick(); setInterval(tick, 20000);

  /* ---------- Print & copy ---------- */
  $$('#btnPrintCV, [data-print]').forEach(b => b.addEventListener('click', () => window.print()));

  // Widget chỉ số trên màn hình chính (mobile) đếm lên khi vừa vào trang
  if (matchMedia('(max-width: 860px)').matches) countUp($('.home'), 300);
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); showToast('Đã sao chép ' + (b.dataset.copyLabel || '')); }
    catch (e) { showToast(b.dataset.copy); }
  }));

  /* ---------- Form liên hệ: gửi AJAX (server trả JSON khi có X-Requested-With) ----------
     Không có JS / fetch lỗi mạng → form vẫn submit bình thường như cũ. */
  const form = $('#contactForm'), notice = $('#contactNotice');
  if (form && notice && window.fetch && window.FormData) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      const setNotice = (ok, msg) => {
        notice.hidden = false;
        notice.className = 'notice ' + (ok ? 'ok' : 'err');
        notice.textContent = msg;
      };
      let res;
      try {
        res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' });
      } catch (err) {
        btn.disabled = false;
        return form.submit();
      }
      try {
        const data = await res.json();
        setNotice(!!data.success, data.message || (data.success ? 'Đã gửi lời nhắn.' : 'Không gửi được lời nhắn, vui lòng thử lại.'));
        if (data.success) { form.reset(); showToast('Đã gửi lời nhắn'); }
      } catch (err) {
        setNotice(false, 'Không gửi được lời nhắn, vui lòng tải lại trang và thử lại.');
      }
      btn.disabled = false;
    });
  }
})();
