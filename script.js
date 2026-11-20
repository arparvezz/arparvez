/* ============================================
   Ar Parvez — Portfolio interactions
   Vanilla ports of motion-brew.com style effects:
   BlurText, FlipWords/BackspaceText, BinaryText, HighlightText,
   MagneticButton, TiltCard, spotlight cards, ContourLines,
   rolling-digit odometer, BlurAccordion.
   ============================================ */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- Year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- BlurText: split into spans ---------- */
  $$('.blur-text').forEach((el) => {
    const mode = el.dataset.split || 'words';
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    const parts = mode === 'chars' ? Array.from(text) : text.split(/(\s+)/);
    el.textContent = '';
    let i = 0;
    parts.forEach((p) => {
      const span = document.createElement('span');
      span.className = 'bt';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = p;
      if (!/^\s+$/.test(p)) {
        span.style.transitionDelay = `${i * (mode === 'chars' ? 45 : 90)}ms`;
        i++;
      }
      el.appendChild(span);
    });
  });

  /* ---------- Loader → hero reveal ---------- */
  const heroEls = $$('.hero .fade-up, .hero .blur-text');
  const revealHero = () => {
    $('#loader')?.classList.add('hidden');
    heroEls.forEach((el, idx) => setTimeout(() => el.classList.add('visible'), reduceMotion ? 0 : 120 + idx * 110));
  };
  if (document.readyState === 'complete') setTimeout(revealHero, 500);
  else window.addEventListener('load', () => setTimeout(revealHero, reduceMotion ? 0 : 700));
  // Safety net in case load stalls on a slow asset
  setTimeout(revealHero, 3000);

  /* ---------- Scroll: navbar, progress, process line ---------- */
  const navbar = $('#navbar');
  const progress = $('.scroll-progress');
  const processList = $('.process-list');
  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 50);
    const navOpen = $('#navLinks').classList.contains('active');
    navbar.classList.toggle('hidden', !navOpen && y > lastY && y > 240);
    lastY = y;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (processList) {
      const r = processList.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (window.innerHeight * 0.8 - r.top) / (r.height + window.innerHeight * 0.3)));
      processList.style.setProperty('--progress', p.toFixed(3));
    }
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');
  const setNav = (open) => {
    navToggle.classList.toggle('active', open);
    navLinks.classList.toggle('active', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  navToggle.addEventListener('click', () => setNav(!navLinks.classList.contains('active')));
  $$('a', navLinks).forEach((a) => a.addEventListener('click', () => setNav(false)));
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) setNav(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNav(false); });

  /* ---------- Odometer (rolling digits) ---------- */
  const buildOdometer = (el) => {
    const target = String(el.dataset.to || el.textContent);
    el.setAttribute('aria-label', target);
    el.textContent = '';
    Array.from(target).forEach((d, idx) => {
      const col = document.createElement('span');
      col.className = 'odo-col';
      col.setAttribute('aria-hidden', 'true');
      for (let n = 0; n <= 9; n++) {
        const s = document.createElement('span');
        s.textContent = n;
        col.appendChild(s);
      }
      col.dataset.digit = d;
      col.style.transitionDelay = `${idx * 120}ms`;
      el.appendChild(col);
    });
  };
  const rollOdometer = (el) => {
    $$('.odo-col', el).forEach((col) => {
      col.style.transform = `translateY(-${Number(col.dataset.digit)}em)`;
    });
  };
  $$('.odometer').forEach(buildOdometer);

  /* ---------- In-view reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      if (el.classList.contains('odometer')) rollOdometer(el);
      if (el.hasAttribute('data-binary-once')) scramble(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('.fade-up, .blur-text, .highlight-text, .odometer')
    .filter((el) => !el.closest('.hero'))
    .forEach((el, i) => {
      // small stagger for siblings in grids
      if (el.classList.contains('fade-up') && el.parentElement) {
        const sibs = $$(':scope > .fade-up', el.parentElement);
        const idx = sibs.indexOf(el);
        if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 5) * 80}ms`;
      }
      io.observe(el);
    });

  /* ---------- FlipWords / BackspaceText ---------- */
  const flip = $('.flip-words');
  if (flip && !reduceMotion) {
    const words = flip.dataset.words.split('|');
    let w = 0;
    let c = words[0].length;
    let deleting = false;
    const tick = () => {
      const word = words[w];
      if (!deleting) {
        c++;
        flip.textContent = word.slice(0, c);
        if (c >= word.length) { deleting = true; return setTimeout(tick, 2000); }
        return setTimeout(tick, 55);
      }
      c--;
      flip.textContent = word.slice(0, c);
      if (c <= 0) { deleting = false; w = (w + 1) % words.length; return setTimeout(tick, 280); }
      return setTimeout(tick, 28);
    };
    setTimeout(() => { deleting = true; tick(); }, 3200);
  }

  /* ---------- BinaryText: scramble to 0/1 then decode ---------- */
  function scramble(el) {
    if (reduceMotion || el._scrambling) return;
    const original = el.dataset.text || el.textContent;
    el.dataset.text = original;
    el._scrambling = true;
    const len = original.length;
    let frame = 0;
    const total = len * 3 + 6;
    const step = () => {
      frame++;
      const revealed = Math.max(0, Math.floor((frame - 6) / 3));
      let out = '';
      for (let i = 0; i < len; i++) {
        const ch = original[i];
        out += i < revealed || ch === ' ' ? ch : Math.random() > 0.5 ? '1' : '0';
      }
      el.textContent = out;
      if (frame < total) requestAnimationFrame(step);
      else { el.textContent = original; el._scrambling = false; }
    };
    requestAnimationFrame(step);
  }
  $$('[data-binary]').forEach((el) => {
    const host = el.closest('a') || el;
    host.addEventListener('mouseenter', () => scramble(el));
    host.addEventListener('focus', () => scramble(el));
  });

  /* ---------- FAQ: blur accordion, one open at a time ---------- */
  $$('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      const body = $('.faq-body', item);
      body.classList.remove('animating');
      void body.offsetWidth;
      body.classList.add('animating');
      $$('.faq-item').forEach((o) => { if (o !== item) o.open = false; });
    });
  });

  if (reduceMotion) return; // everything below is pointer/ambient motion

  /* ---------- Cursor glow ---------- */
  if (finePointer) {
    const glow = $('.cursor-glow');
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY;
      document.body.classList.add('has-pointer');
    }, { passive: true });
    const loop = () => {
      gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
      glow.style.transform = `translate3d(${gx - 260}px, ${gy - 260}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Magnetic buttons (spring) ---------- */
  if (finePointer) {
    $$('.magnetic').forEach((btn) => {
      const strength = 0.35;
      let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, raf = null;
      const inner = $$('span, svg', btn);
      const animate = () => {
        // spring physics: stiffness 0.15, damping 0.75
        vx = (vx + (tx - x) * 0.15) * 0.75;
        vy = (vy + (ty - y) * 0.15) * 0.75;
        x += vx; y += vy;
        btn.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        inner.forEach((n) => (n.style.transform = `translate3d(${x * 0.35}px, ${y * 0.35}px, 0)`));
        if (Math.abs(tx - x) > 0.05 || Math.abs(ty - y) > 0.05 || Math.abs(vx) > 0.05) raf = requestAnimationFrame(animate);
        else raf = null;
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(animate); };
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        tx = (e.clientX - (r.left + r.width / 2)) * strength;
        ty = (e.clientY - (r.top + r.height / 2)) * strength;
        kick();
      });
      btn.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    });
  }

  /* ---------- Tilt cards with glare ---------- */
  if (finePointer) {
    $$('.tilt').forEach((card) => {
      const max = Number(card.dataset.tilt || 8);
      const glare = $('.glare', card);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.transform = `perspective(1000px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg) translateZ(0) scale(1.015)`;
        if (glare) {
          glare.style.setProperty('--gx', `${(1 - px) * 100}%`);
          glare.style.setProperty('--gy', `${(1 - py) * 100}%`);
        }
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('tilting');
        card.style.transform = '';
      });
    });
  }

  /* ---------- Spotlight border cards ---------- */
  $$('.spotlight').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  /* ---------- Contour lines background (hero) ---------- */
  const canvas = $('.contour-canvas');
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const hero = $('.hero');
    let w = 0, h = 0, dpr = 1, t = 0, running = true;
    const mouse = { x: -9999, y: -9999, sx: -9999, sy: -9999 };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });

    // pause when hero is off-screen
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) requestAnimationFrame(draw);
    }).observe(hero);

    const LINES = 26;
    function field(x, y, tt) {
      return (
        Math.sin(x * 0.0042 + tt * 0.6) * 22 +
        Math.sin(x * 0.009 - tt * 0.4 + y * 0.004) * 12 +
        Math.cos(x * 0.0021 + y * 0.006 + tt * 0.3) * 18
      );
    }
    function draw() {
      if (!running) return;
      t += 0.006;
      mouse.sx += (mouse.x - mouse.sx) * 0.08;
      mouse.sy += (mouse.y - mouse.sy) * 0.08;
      ctx.clearRect(0, 0, w, h);
      const gap = h / (LINES - 4);
      for (let i = 0; i < LINES; i++) {
        const baseY = (i - 2) * gap;
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 14) {
          let y = baseY + field(x, baseY, t + i * 0.12);
          const dx = x - mouse.sx, dy = y - mouse.sy;
          const d2 = dx * dx + dy * dy;
          const R = 170;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const push = (1 - d / R) ** 2 * 60;
            y += (dy / d) * push;
          }
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const a = 0.05 + (i % 5 === 0 ? 0.09 : 0.03);
        ctx.strokeStyle = i % 5 === 0 ? `rgba(0,255,136,${a + 0.05})` : `rgba(255,255,255,${a})`;
        ctx.lineWidth = i % 5 === 0 ? 1.1 : 0.8;
        ctx.stroke();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
