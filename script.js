/* Configuración del sitio */
const SITE = {
  "loader": { "duration": 2100 },
  "smooth": true,
  "wa": {
    "number": "525543242885",
    "greeting": "Hola Kilsafran, quiero hacer un pedido."
  },
  "labels": { "opening": "Abriendo WhatsApp…" }
};

/* ==========================================================================
   KILSAFRAN · motor de animación
   Dependencias locales (vendor/): GSAP + ScrollTrigger + Lenis.
   Todo es mejora progresiva: si una librería no carga o el usuario prefiere
   menos movimiento, el sitio se ve completo y funciona igual.
   Módulos: loader · header · scroll suave · split-text · reveal · escenas de
            scroll (hero, manifiesto, camioneta, teléfonos, proceso, galería,
            CTA, footer) · marquee por velocidad · hero 3D · cursor · orbit
            videos · lightbox · FAQ · formulario → WhatsApp · botón flotante
   ========================================================================== */
(() => {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const cfg = (typeof SITE !== 'undefined' && SITE) || {};
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  let lenis = null;
  let navLockUntil = 0;                                   // mientras navegas por anclas el header no se oculta
  let scrollToY = (y) => scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  const stopScroll = () => lenis && lenis.stop();
  const startScroll = () => lenis && lenis.start();
  const refreshST = (() => { let t; return () => { if (!hasGsap) return; clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 120); }; })();

  /* ---------- 1 · Loader -------------------------------------------------- */
  function runLoader() {
    const el = $('#loader');
    return new Promise((resolve) => {
      if (!el || reduce) { el && el.remove(); root.classList.remove('is-loading'); return resolve(); }
      const dur = (cfg.loader && cfg.loader.duration) || 2000;
      const pct = $('#loaderPct');
      const t0 = performance.now();
      let ready = document.readyState === 'complete';
      if (!ready) addEventListener('load', () => (ready = true), { once: true });
      setTimeout(() => (ready = true), 4500);            // nunca esperes más de 4.5 s por imágenes lentas
      let p = 0;
      const tick = (now) => {
        const t = clamp((now - t0) / dur, 0, 1);
        let v = 1 - Math.pow(1 - t, 3);                    // easeOutCubic
        if (!ready) v = Math.min(v, 0.94);                 // espera la carga real antes de llegar a 100
        p = Math.max(p, v);
        el.style.setProperty('--p', p.toFixed(3));
        if (pct) pct.textContent = Math.round(p * 100);
        if (p >= 1) return finish();
        requestAnimationFrame(tick);
      };
      const finish = () => {
        el.classList.add('is-done');
        root.classList.remove('is-loading');
        setTimeout(resolve, 520);                          // el hero entra mientras se abren las cortinas
        setTimeout(() => el.remove(), 1800);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- 2 · Header, menú móvil e indicador de navegación ------------ */
  function header() {
    const h = $('.site-header');
    const burger = $('.burger');
    const nav = $('#menu');
    let lastY = scrollY, hidden = false;
    const onScroll = () => {
      const y = scrollY, open = root.classList.contains('menu-open');
      h && h.classList.toggle('is-scrolled', y > 24);
      if (!h) return;
      if (!open && y > 520 && y > lastY + 4 && performance.now() > navLockUntil) { if (!hidden) { h.classList.add('is-hidden'); hidden = true; } }
      else if (hidden && (open || y < lastY - 4 || y <= 520)) { h.classList.remove('is-hidden'); hidden = false; }
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    if (!burger || !nav) return;
    const set = (open) => {
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      nav.classList.toggle('is-open', open);
      root.classList.toggle('menu-open', open);
      open ? stopScroll() : startScroll();
      if (open && hidden) { h.classList.remove('is-hidden'); hidden = false; }
    };
    burger.addEventListener('click', () => set(burger.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => e.target.closest('a') && set(false));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('menu-open')) { set(false); burger.focus(); } });
    matchMedia('(min-width: 960px)').addEventListener('change', (e) => e.matches && set(false));

    // enlace activo según la sección visible + indicador deslizante
    const ind = $('.nav__ind', nav);
    const ul = $('ul', nav);
    const links = $$('a[href^="#"]', ul).filter((a) => a.getAttribute('href').length > 1);
    const place = (a) => {
      if (!ind || !a || innerWidth < 960) return;
      ind.style.setProperty('--x', a.offsetLeft + 'px');
      ind.style.setProperty('--w', a.offsetWidth + 'px');
      ind.classList.add('is-on');
    };
    const current = () => links.find((a) => a.getAttribute('aria-current') === 'true');
    const settle = () => { const c = current(); c ? place(c) : ind && ind.classList.remove('is-on'); };
    links.forEach((a) => { a.addEventListener('pointerenter', () => place(a)); a.addEventListener('focus', () => place(a)); a.addEventListener('blur', settle); });
    ul.addEventListener('pointerleave', settle);
    addEventListener('resize', settle);
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.removeAttribute('aria-current'));
      const a = map.get(en.target.id); a && a.setAttribute('aria-current', 'true');
      settle();
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------- 2b · Indicador lateral de secciones -------------------------- */
  function dots() {
    const links = $$('.dots a');
    if (!links.length) return;
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => a.classList.remove('is-on'));
      const a = map.get(en.target.id); a && a.classList.add('is-on');
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); s && io.observe(s); });
  }

  /* ---------- 3 · Scroll suave (Lenis) + anclas --------------------------- */
  function smoothScroll() {
    if (reduce || cfg.smooth === false || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    scrollToY = (y) => lenis.scrollTo(y, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    lenis.stop();                                          // se libera cuando termina el loader
  }
  function anchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const dest = document.getElementById(a.getAttribute('href').slice(1));
      if (!dest) return;
      e.preventDefault();
      navLockUntil = performance.now() + 2200;
      const hh = parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) * 16 || 72;
      const top = dest.getBoundingClientRect().top + scrollY;
      scrollToY(dest.id === 'inicio' ? 0 : top - hh + 1);
      history.replaceState(null, '', a.getAttribute('href'));
    });
  }

  /* ---------- 4 · Titulares partidos en palabras -------------------------- */
  function splitWords(el, mode) {
    let i = 0;
    const walk = (node, grad) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((tok) => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) return frag.appendChild(document.createTextNode(' '));
            if (mode === 'scrub') {
              const s = document.createElement('span'); s.className = 'sw' + (grad ? ' grad-w' : ''); s.textContent = tok;
              return frag.appendChild(s);
            }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.className = 'wi' + (grad ? ' grad-w' : '');
            s.style.setProperty('--i', i++); s.textContent = tok;
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          const isGrad = n.classList.contains('grad');
          if (isGrad) n.classList.remove('grad');          // el degradado pasa a cada palabra
          walk(n, grad || isGrad);
        }
      });
    };
    walk(el, false);
  }
  function splitAll() {
    const hero = $('.hero__title');
    $$('[data-split]').forEach((h) => { if (h === hero) h.style.setProperty('--sd', '200ms'); splitWords(h); });
    $$('[data-scrub-words]').forEach((p) => splitWords(p, 'scrub'));
  }

  /* ---------- 5 · Reveal al hacer scroll ---------------------------------- */
  function reveal() {
    $$('[data-stagger]').forEach((p) =>
      $$(':scope > [data-reveal]', p).forEach((c, i) => c.style.setProperty('--d', (i * 0.09).toFixed(2) + 's')));
    const items = $$('[data-reveal], [data-split]').filter((n) => !n.classList.contains('hero__title'));
    if (reduce || !('IntersectionObserver' in window)) return items.forEach((n) => n.classList.add('is-in'));
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((n) => io.observe(n));
  }

  /* ---------- 6 · Escenas ligadas al scroll (GSAP) ------------------------ */
  function progressBar() {
    const bar = $('.progress');
    if (!bar) return;
    let ticking = false;
    const upd = () => { ticking = false; bar.style.setProperty('--sp', (scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4)); };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
  function staticProcess() {
    $$('.step').forEach((s) => s.classList.add('is-active'));
    const pr = $('.process');
    if (pr) { pr.style.setProperty('--p', 1); pr.style.setProperty('--fill', '100%'); }
  }
  function scenes() {
    if (!hasGsap || reduce) { staticProcess(); return; }
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    const st = (trigger, start, end, scrub = true, extra = {}) => ({ trigger, start, end, scrub, invalidateOnRefresh: true, ...extra });

    // Hero: el contenido se aleja con profundidad al bajar
    const hero = $('.hero');
    if (hero) {
      gsap.timeline({ scrollTrigger: st(hero, 'top top', 'bottom top') })
        .to('.hero__copy', { y: -70, opacity: 0.1, ease: 'none' }, 0)
        .to('.hero__stage', { y: -130, scale: 0.9, ease: 'none' }, 0)
        .to('.hero__bg', { y: 100, ease: 'none' }, 0)
        .to('.scroll-cue', { opacity: 0, ease: 'none' }, 0);
    }

    // Manifiesto: las palabras se encienden con el scroll
    $$('[data-scrub-words]').forEach((p) => {
      const words = $$('.sw', p);
      gsap.fromTo(words, { opacity: 0.13 }, { opacity: 1, ease: 'none', stagger: 0.3,
        scrollTrigger: st(p, 'top 82%', 'bottom 55%', 0.5) });
    });

    // Camioneta: entra rodando
    const van = $('.van');
    if (van) {
      gsap.fromTo(van, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: st(van, 'top 98%', 'top 38%', 0.6) });
      gsap.fromTo('.van__stage img', { xPercent: 9, scale: 1.2 }, { xPercent: 0, scale: 1, ease: 'none', scrollTrigger: st(van, 'top bottom', 'bottom 62%', 0.6) });
    }

    // Teléfonos de video: parallax a distintas velocidades
    $$('.phone[data-speed]').forEach((el) => {
      const s = parseFloat(el.dataset.speed) || 0;
      mm.add({ big: '(min-width: 900px)', small: '(max-width: 899px)' }, (ctx) => {
        const k = ctx.conditions.big ? 1 : 0.5;
        gsap.fromTo(el, { '--py': -s * k }, { '--py': s * k, ease: 'none', scrollTrigger: st(el.closest('.show'), 'top bottom', 'bottom top') });
      });
    });

    // Proceso: escena fija (escritorio) · línea que se llena (móvil)
    const sec = $('.sec--process');
    if (sec) {
      const pr = $('.process', sec), steps = $$('.step', sec);
      mm.add('(min-width: 960px)', () => {
        sec.classList.add('is-scrub');
        const apply = (progress) => {
          const p = clamp((progress - 0.06) / 0.82, 0, 1);
          pr.style.setProperty('--p', p.toFixed(4));
          let cur = -1;
          steps.forEach((s, i) => { const on = p >= i / (steps.length - 1) - 0.001; s.classList.toggle('is-active', on); if (on) cur = i; });
          steps.forEach((s, i) => s.classList.toggle('is-current', i === cur));
        };
        const t = ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (self) => apply(self.progress), onRefresh: (self) => apply(self.progress) });
        refreshST();
        return () => { t.kill(); sec.classList.remove('is-scrub'); pr.style.removeProperty('--p'); steps.forEach((s) => s.classList.remove('is-active', 'is-current')); };
      });
      mm.add('(max-width: 959px)', () => {
        const rail = $('.process__rail', sec);
        const upd = () => {
          const line = innerHeight * 0.62;
          const r = rail.getBoundingClientRect();
          const nl = steps[steps.length - 1].querySelector('.step__n').getBoundingClientRect();
          const endY = nl.top + nl.height / 2 - r.top;
          rail.style.setProperty('--rh', endY + 'px');
          pr.style.setProperty('--fill', clamp(line - r.top, 0, endY) + 'px');
          steps.forEach((s) => { const n = s.querySelector('.step__n').getBoundingClientRect(); s.classList.toggle('is-active', n.top + n.height / 2 <= line + 1); });
        };
        const t = ScrollTrigger.create({ trigger: pr, start: 'top bottom', end: 'bottom top', onUpdate: upd, onRefresh: upd });
        return () => { t.kill(); rail.style.removeProperty('--rh'); pr.style.removeProperty('--fill'); steps.forEach((s) => s.classList.remove('is-active')); };
      });
    }

    // Galería: tres hileras que se deslizan en sentidos opuestos
    $$('.strip').forEach((strip) => {
      const track = $('.strip__track', strip), dir = Number(strip.dataset.dir) || -1;
      const dx = () => Math.max(0, track.scrollWidth - strip.clientWidth);
      gsap.fromTo(track, { x: () => (dir < 0 ? 0 : -dx()) }, { x: () => (dir < 0 ? -dx() : 0), ease: 'none', scrollTrigger: st(strip, 'top bottom', 'bottom top', 0.6) });
    });

    // CTA y footer
    const card = $('[data-cta-card]');
    if (card) gsap.fromTo(card, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: st(card, 'top 98%', 'top 42%', 0.6) });
    const mark = $('[data-footer-mark]');
    if (mark) gsap.fromTo(mark, { yPercent: 42, opacity: 0 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: st($('.site-footer'), 'top 88%', 'bottom bottom', 0.6) });

    marqueeVelocity();
  }

  /* ---------- 7 · Marquee: la velocidad responde al scroll ---------------- */
  function marqueeVelocity() {
    const anims = $$('.marquee__track').map((t) => t.getAnimations()[0]).filter(Boolean);
    if (!anims.length) return;
    let boost = 0, dir = 1, rate = 1;
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => {
      const v = Math.abs(self.getVelocity());
      boost = Math.max(boost, Math.min(v / 380, 7));
      if (self.direction) dir = self.direction;
    } });
    gsap.ticker.add(() => {
      boost = lerp(boost, 0, 0.06);
      rate = lerp(rate, dir * (1 + boost), 0.1);
      anims.forEach((a) => a.updatePlaybackRate(rate));
    });
  }

  /* ---------- 8 · Spotlight + tilt en tarjetas, botones magnéticos -------- */
  function pointerFx() {
    if (!fine || reduce) return;
    $$('.card, .info-list li').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', e.clientX - r.left + 'px');
        el.style.setProperty('--my', e.clientY - r.top + 'px');
        if (el.hasAttribute('data-tilt')) {
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-4px)`;
        }
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * 0.32).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 9 · Hero: 3D con el puntero + red de partículas ------------- */
  function heroFx() {
    const hero = $('.hero');
    if (!hero) return;
    const frame = $('[data-frame]', hero), deps = $$('[data-depth]', hero), bg = $('.hero__bg', hero);
    let visible = true;
    if (fine && !reduce) {
      let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      hero.addEventListener('pointerleave', () => { tx = ty = 0; });
      const loop = () => {
        cx = lerp(cx, tx, 0.07); cy = lerp(cy, ty, 0.07);
        if (frame) frame.style.transform = `perspective(1100px) rotateY(${(cx * 5).toFixed(2)}deg) rotateX(${(-cy * 4).toFixed(2)}deg)`;
        deps.forEach((d) => { const k = parseFloat(d.dataset.depth) * 0.8; d.style.translate = `${(cx * k).toFixed(1)}px ${(cy * k).toFixed(1)}px`; });
        if (bg) bg.style.translate = `${(cx * -16).toFixed(1)}px ${(cy * -16).toFixed(1)}px`;
        raf = visible ? requestAnimationFrame(loop) : 0;
      };
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(loop); }).observe(hero);
      raf = requestAnimationFrame(loop);
    }
    const canvas = $('.hero__canvas', hero);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, pts = [], raf = 0, col = '63 155 11';
    const mouse = { x: -9999, y: -9999 };
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp((w * h) / (reduce ? 80000 : 19000), 22, 90));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.32, vy: (Math.random() - 0.5) * 0.32, r: Math.random() * 1.6 + 0.6,
      }));
      col = getComputedStyle(canvas).getPropertyValue('--glow-rgb').trim() || col;
    };
    const frameFn = () => {
      ctx.clearRect(0, 0, w, h);
      const LINK = Math.min(140, w / 5), L2 = LINK * LINK;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = w + 20; else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20; else if (p.y > h + 20) p.y = -20;
        const mx = mouse.x - p.x, my = mouse.y - p.y, md = mx * mx + my * my;
        if (md < 28000) { p.x -= mx * 0.0016; p.y -= my * 0.0016; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgb(${col} / .8)`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < L2) {
            ctx.strokeStyle = `rgb(${col} / ${((1 - d / L2) * 0.3).toFixed(3)})`;
            ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (md < 32000) {
          ctx.strokeStyle = `rgb(${col} / ${((1 - md / 32000) * 0.6).toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(frameFn) : 0;
    };
    const play = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frameFn); };
    resize(); reduce ? frameFn() : play();
    let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { resize(); if (reduce) frameFn(); }, 180); });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; play(); }).observe(hero);
    document.addEventListener('visibilitychange', play);
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }

  /* ---------- 10 · Cursor: luz y anillo ----------------------------------- */
  function cursor() {
    if (!fine || reduce) return;
    const glow = $('.cursor-glow'), c = $('.cursor');
    let x = innerWidth / 2, y = innerHeight / 2, gx = x, gy = y, cx = x, cy = y, on = false;
    if (c) root.classList.add('has-cursor');
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (!on) { on = true; root.classList.add('has-pointer'); } }, { passive: true });
    const label = c && $('.cursor__label', c);
    const sel = 'a,button,summary,input,select,textarea,label,[data-magnetic]';
    document.addEventListener('pointerover', (e) => {
      if (!c) return;
      const view = e.target.closest('[data-cursor]');
      if (view) { label.textContent = view.dataset.cursor; c.classList.add('is-view'); c.classList.remove('is-link'); return; }
      c.classList.remove('is-view');
      c.classList.toggle('is-link', !!e.target.closest(sel));
    });
    document.addEventListener('pointerleave', () => { on = false; root.classList.remove('has-pointer'); });
    const loop = () => {
      gx = lerp(gx, x, 0.12); gy = lerp(gy, y, 0.12); cx = lerp(cx, x, 0.22); cy = lerp(cy, y, 0.22);
      if (glow) glow.style.transform = `translate3d(${gx.toFixed(1)}px,${gy.toFixed(1)}px,0)`;
      if (c) c.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- 11 · Videos: reproducen solo cuando se ven ------------------ */
  function videos() {
    const vs = $$('video[data-autoplay]');
    if (!vs.length) return;
    if (reduce) { vs.forEach((v) => v.setAttribute('controls', '')); return; }
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) { const p = v.play(); p && p.catch(() => {}); } else v.pause();
    }), { threshold: 0.25 });
    vs.forEach((v) => io.observe(v));
  }

  /* ---------- 12 · Órbita de productos (gira con el tiempo y el scroll) --- */
  function orbit() {
    const el = $('[data-orbit]');
    if (!el || reduce) return;
    let vis = false, raf = 0;
    const t0 = performance.now();
    const loop = (now) => {
      el.style.setProperty('--rot', (((now - t0) / 1000) * 5 + scrollY * 0.05).toFixed(2) + 'deg');
      raf = vis ? requestAnimationFrame(loop) : 0;
    };
    new IntersectionObserver(([en]) => { vis = en.isIntersecting; if (vis && !raf) raf = requestAnimationFrame(loop); }, { rootMargin: '80px' }).observe(el);
  }

  /* ---------- 13 · Lightbox de la galería --------------------------------- */
  function lightbox() {
    const dlg = $('#lightbox');
    const btns = $$('.shot__btn');
    if (!dlg || !dlg.showModal || !btns.length) return;
    const img = $('.lb__img', dlg), cap = $('.lb__cap', dlg), cnt = $('.lb__count', dlg);
    let i = 0, last = null, sx = 0;
    const preload = (n) => { const b = btns[(n + btns.length) % btns.length]; if (b) new Image().src = b.dataset.full; };
    const show = (n, instant) => {
      i = (n + btns.length) % btns.length;
      const b = btns[i];
      const apply = () => {
        img.src = b.dataset.full; img.alt = $('img', b).alt;
        cap.textContent = b.dataset.cap; cnt.textContent = `${i + 1} / ${btns.length}`;
        img.classList.remove('is-swap');
      };
      if (instant || reduce) apply(); else { img.classList.add('is-swap'); setTimeout(apply, 170); }
      preload(i + 1); preload(i - 1);
    };
    const open = (n) => {
      last = document.activeElement;
      dlg.showModal(); root.classList.add('lb-open'); stopScroll();
      show(n, true);
      $('.lb__close', dlg).focus({ preventScroll: true });
    };
    const close = () => {
      if (!dlg.open || dlg.classList.contains('is-closing')) return;
      dlg.classList.add('is-closing');
      setTimeout(() => { dlg.close(); dlg.classList.remove('is-closing'); }, reduce ? 0 : 260);
    };
    btns.forEach((b, n) => b.addEventListener('click', () => open(n)));
    $('.lb__close', dlg).addEventListener('click', close);
    $('.lb__nav--prev', dlg).addEventListener('click', () => show(i - 1));
    $('.lb__nav--next', dlg).addEventListener('click', () => show(i + 1));
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lb__fig')) close(); });
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
    dlg.addEventListener('close', () => {
      root.classList.remove('lb-open');
      if (!root.classList.contains('menu-open')) startScroll();
      last && last.focus && last.focus({ preventScroll: true });
    });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(i - 1); else if (e.key === 'ArrowRight') show(i + 1);
    });
    dlg.addEventListener('touchstart', (e) => { sx = e.changedTouches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* ---------- 14 · FAQ con altura animada --------------------------------- */
  function faq() {
    const ease = 'cubic-bezier(.22,1,.36,1)';
    $$('details.faq').forEach((d) => {
      const sum = $('summary', d), body = $('.faq__a', d);
      let anim = null;
      sum.addEventListener('click', (e) => {
        if (reduce || !body.animate) return;
        e.preventDefault();
        if (anim) anim.cancel();
        if (d.open) {
          d.classList.add('is-closing');
          anim = body.animate({ height: [body.offsetHeight + 'px', '0px'], opacity: [1, 0] }, { duration: 360, easing: ease });
          anim.onfinish = () => { d.open = false; d.classList.remove('is-closing'); anim = null; refreshST(); };
        } else {
          d.open = true;
          anim = body.animate({ height: ['0px', body.offsetHeight + 'px'], opacity: [0, 1] }, { duration: 460, easing: ease });
          anim.onfinish = () => { anim = null; refreshST(); };
        }
      });
    });
  }

  /* ---------- 15 · Formulario → WhatsApp + botón flotante ----------------- */
  function whatsapp() {
    const wa = cfg.wa || {};
    const form = $('#contactForm');
    document.addEventListener('click', (e) => {         // "Quiero pedir esto" preselecciona el servicio
      const a = e.target.closest('[data-service]');
      if (a && form && form.service) form.service.value = a.dataset.service;
    });
    if (form) {
      const status = $('.form__status', form);
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.website && form.website.value) return;              // honeypot anti-spam
        if (!form.checkValidity()) { form.reportValidity(); return; }
        const v = (n) => (form[n] && form[n].value || '').trim();
        const lines = [wa.greeting || 'Hola, los vi en su página web.'];
        lines.push('', '*Nombre:* ' + v('nombre'));
        if (v('telefono')) lines.push('*Teléfono:* ' + v('telefono'));
        if (v('service')) lines.push('*Me interesa:* ' + v('service'));
        if (v('mensaje')) lines.push('*Mensaje:* ' + v('mensaje'));
        const url = `https://wa.me/${wa.number}?text=${encodeURIComponent(lines.join('\n'))}`;
        if (status) status.textContent = (cfg.labels && cfg.labels.opening) || 'Abriendo WhatsApp…';
        const win = window.open(url, '_blank');                      // (con 'noopener' siempre devuelve null y navegaba también esta pestaña)
        if (win) win.opener = null; else location.href = url;        // popup bloqueado → misma pestaña
      });
    }
    const fl = $('.wa-float');
    if (fl) {                                                        // burbuja de invitación, una sola vez
      setTimeout(() => fl.classList.add('show-label'), 6500);
      setTimeout(() => fl.classList.remove('show-label'), 12500);
    }
  }

  /* ---------- Utilidades de layout ---------------------------------------- */
  function gutter() {                                                // alinea las hileras de la galería con el contenedor
    const c = $('.container');
    const set = () => c && root.style.setProperty('--gutter', Math.max(0, c.getBoundingClientRect().left) + 'px');
    set(); addEventListener('resize', set);
  }

  /* ---------- Arranque ----------------------------------------------------- */
  function boot() {
    gutter(); progressBar(); header(); dots(); smoothScroll(); anchors(); splitAll(); reveal();
    pointerFx(); heroFx(); cursor(); videos(); orbit(); lightbox(); faq(); whatsapp(); scenes();
    runLoader().then(() => {
      root.classList.add('is-ready');
      const t = $('.hero__title'); t && t.classList.add('is-in');
      startScroll();
      refreshST();
    });
    addEventListener('load', refreshST);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshST);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(() => { root.classList.remove('is-loading'); startScroll(); }, 9000);   // red de seguridad
})();
