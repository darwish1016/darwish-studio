/* ==========================================================================
   Omar Darwish — portfolio interactions
   Plain JavaScript, no libraries.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const storage = (type) => ({
    get(key) { try { return window[type].getItem(key); } catch { return null; } },
    set(key, value) { try { window[type].setItem(key, value); } catch { /* storage blocked */ } }
  });
  const local = storage('localStorage');
  const session = storage('sessionStorage');

  /* ---------- Page load + arriving transition ---------- */
  const markLoaded = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add('is-loaded');
    if (root.classList.contains('pt-arrive')) {
      root.classList.add('pt-go');
      setTimeout(() => root.classList.remove('pt-arrive', 'pt-go'), 1200);
    }
  }));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', markLoaded, { once: true });
  } else {
    markLoaded();
  }

  // Coming back with the browser's back button restores a "covered" page; uncover it.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) root.classList.remove('pt-leave', 'pt-arrive', 'pt-go');
  });

  /* ---------- Leaving transition for links to other pages ---------- */
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || reducedMotion) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // same-page anchor
    if (!/\.html?$|\/$/.test(url.pathname)) return; // only pages, not files

    event.preventDefault();
    closeMenu();
    session.set('pt', '1');
    root.classList.add('pt-leave');
    setTimeout(() => { location.href = url.href; }, 780);
  });

  /* ---------- Theme toggle ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  const syncThemeUi = () => {
    const dark = root.dataset.theme === 'dark';
    $$('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    });
    if (themeMeta) themeMeta.content = dark ? '#121218' : '#fffaf2';
  };
  syncThemeUi();
  $$('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      local.set('theme', next);
      syncThemeUi();
      window.dispatchEvent(new CustomEvent('themechange'));
    });
  });

  /* ---------- Full-screen menu ---------- */
  const menu = $('#menu');
  const menuButton = $('[data-menu-toggle]');
  let lastFocus = null;

  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    root.classList.add('menu-open');
    menu.removeAttribute('inert');
    menu.setAttribute('aria-hidden', 'false');
    menuButton?.setAttribute('aria-expanded', 'true');
    menuButton?.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('a', menu)?.focus({ preventScroll: true }), 300);
  }

  function closeMenu() {
    if (!menu || !root.classList.contains('menu-open')) return;
    root.classList.remove('menu-open');
    menu.setAttribute('inert', '');
    menu.setAttribute('aria-hidden', 'true');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    lastFocus?.focus?.({ preventScroll: true });
  }

  menuButton?.addEventListener('click', () => {
    root.classList.contains('menu-open') ? closeMenu() : openMenu();
  });
  menu?.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) closeMenu();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  /* ---------- Nav pill label follows the section in view ---------- */
  const navLabel = $('[data-nav-label]');
  const navSections = $$('[data-nav]');
  if (navLabel && navSections.length && 'IntersectionObserver' in window) {
    const labelObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) navLabel.textContent = entry.target.dataset.nav;
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach((section) => labelObserver.observe(section));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealItems = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-in'));
  }

  /* ---------- About paragraph: words light up as you scroll ---------- */
  const litText = $('[data-scroll-text]');
  if (litText && !reducedMotion) {
    const words = [];
    const split = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const fragment = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              fragment.append(part);
            } else {
              const span = document.createElement('span');
              span.className = 'w';
              span.textContent = part;
              fragment.append(span);
              words.push(span);
            }
          });
          child.replaceWith(fragment);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.classList.contains('glyph')) {
            child.classList.add('w');
            words.push(child);
          } else {
            split(child);
          }
        }
      });
    };
    split(litText);

    let litCount = -1;
    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = litText.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.85 - rect.top) / (rect.height + vh * 0.25);
      const count = Math.round(Math.min(1, Math.max(0, progress)) * words.length);
      if (count === litCount) return;
      litCount = count;
      words.forEach((word, index) => word.classList.toggle('is-lit', index < count));
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Count-up numbers ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reducedMotion) {
    const run = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const start = performance.now();
      const duration = 1600;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => {
      el.textContent = '0' + (el.dataset.suffix || '');
      countObserver.observe(el);
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $('.cursor');
  if (cursor && finePointer && !reducedMotion) {
    root.classList.add('has-cursor');
    let x = -100, y = -100, cx = -100, cy = -100;
    const label = cursor.querySelector('span');

    window.addEventListener('pointermove', (event) => {
      x = event.clientX;
      y = event.clientY;
      cursor.classList.remove('is-hidden');
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));

    document.addEventListener('pointerover', (event) => {
      const view = event.target.closest('[data-cursor]');
      const interactive = event.target.closest('a, button, label, input, textarea, [role="button"]');
      cursor.classList.toggle('is-view', Boolean(view));
      cursor.classList.toggle('is-link', !view && Boolean(interactive));
      if (label) label.textContent = view ? view.dataset.cursor : '';
    });

    const follow = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ---------- Contact form (FormSubmit) ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const button = $('button[type="submit"]', form);
    const buttonText = button?.innerHTML;
    button?.setAttribute('aria-busy', 'true');
    if (button) button.textContent = 'Sending…';
    status.className = 'form__status';
    status.textContent = 'Sending your message…';

    try {
      const endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error(result.message || 'Message not sent');
      }
      form.reset();
      status.classList.add('is-ok');
      status.textContent = 'Thanks! Your message is on its way. I’ll get back to you soon.';
    } catch (error) {
      console.error('FormSubmit error:', error);
      status.classList.add('is-error');
      status.textContent = 'Sorry, that didn’t send. Please email me at omarnacilla@gmail.com.';
    } finally {
      button?.removeAttribute('aria-busy');
      if (button) button.innerHTML = buttonText;
    }
  });

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Live clocks (numbers section) ---------- */
  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const formatters = clocks.map((el) => new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: el.dataset.clock
    }));
    const tickClocks = () => clocks.forEach((el, i) => {
      el.textContent = formatters[i].format(new Date()).replace(/\s?([ap])\.?m\.?/i, ' $1m');
    });
    tickClocks();
    setInterval(tickClocks, 15000);
  }

  /* ---------- Hero: throwable stickers with simple physics ---------- */
  const hero = $('.hero');
  if (hero) stickerPlayground(hero);

  function stickerPlayground(stage) {
    const play = $('.hero__play', stage);
    const els = $$('.sticker', stage).filter((el) => getComputedStyle(el).display !== 'none');
    if (!play || !els.length) return;

    const GRAVITY = 2600;     // px/s²
    const BOUNCE = 0.32;      // restitution
    const MAX_SPEED = 3200;
    let width = 0;
    let floor = 0;

    const bodies = els.map((el, i) => ({
      el,
      scale: parseFloat(el.dataset.size) || 1,
      x: 0, y: 0, vx: 0, vy: 0, a: 0, r: 40,
      drag: false, active: false, delay: 250 + i * 140
    }));

    const measure = () => {
      width = stage.clientWidth;
      floor = play.offsetTop + play.offsetHeight - 6;
      const base = Math.max(42, Math.min(66, width / 19));
      bodies.forEach((b) => {
        b.r = base * b.scale;
        b.el.style.setProperty('--d', `${(b.r * 2).toFixed(1)}px`);
        b.x = Math.min(Math.max(b.x, b.r), width - b.r);
        if (b.active) b.y = Math.min(b.y, floor - b.r);
      });
    };

    const spawn = (b, i) => {
      b.x = b.r + ((i * 0.618 + 0.13) % 1) * (width - 2 * b.r);
      b.y = -b.r - 40;
      b.vx = (Math.random() - 0.5) * 300;
      b.vy = 200;
      b.a = (Math.random() - 0.5) * 1.2;
    };

    const render = () => {
      bodies.forEach((b) => {
        b.el.style.transform = `translate3d(${(b.x - b.r).toFixed(1)}px, ${(b.y - b.r).toFixed(1)}px, 0) rotate(${b.a.toFixed(3)}rad)`;
      });
    };

    const step = (dt) => {
      const live = bodies.filter((b) => b.active);
      live.forEach((b) => {
        if (b.drag) return;
        b.vy += GRAVITY * dt;
        b.vx *= 0.999;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += (b.vx * dt) / b.r * 0.6;
      });

      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < live.length; i++) {
          for (let j = i + 1; j < live.length; j++) {
            const p = live[i], q = live[j];
            const dx = q.x - p.x, dy = q.y - p.y;
            const min = p.r + q.r;
            const distSq = dx * dx + dy * dy;
            if (distSq >= min * min || distSq === 0) continue;
            const dist = Math.sqrt(distSq);
            const nx = dx / dist, ny = dy / dist;
            const ip = p.drag ? 0 : 1 / (p.r * p.r);
            const iq = q.drag ? 0 : 1 / (q.r * q.r);
            const total = ip + iq;
            if (!total) continue;
            const overlap = min - dist;
            p.x -= nx * overlap * (ip / total);
            p.y -= ny * overlap * (ip / total);
            q.x += nx * overlap * (iq / total);
            q.y += ny * overlap * (iq / total);
            const rel = (q.vx - p.vx) * nx + (q.vy - p.vy) * ny;
            if (rel < 0) {
              const impulse = (-(1 + BOUNCE) * rel) / total;
              p.vx -= impulse * ip * nx; p.vy -= impulse * ip * ny;
              q.vx += impulse * iq * nx; q.vy += impulse * iq * ny;
            }
          }
        }
        live.forEach((b) => {
          if (b.drag) return;
          if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * BOUNCE; }
          if (b.x + b.r > width) { b.x = width - b.r; b.vx = -Math.abs(b.vx) * BOUNCE; }
          if (b.y - b.r < 0 && b.vy < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * BOUNCE; }
          if (b.y + b.r > floor) {
            b.y = floor - b.r;
            if (b.vy > 0) b.vy = b.vy < 60 ? 0 : -b.vy * BOUNCE;
            b.vx *= 0.94;
          }
        });
      }
    };

    measure();
    bodies.forEach(spawn);

    // Reduced motion: settle everything instantly, no falling entrance.
    if (reducedMotion) {
      bodies.forEach((b) => { b.active = true; });
      for (let i = 0; i < 900; i++) step(1 / 120);
      render();
    } else {
      bodies.forEach((b) => b.el.classList.add('is-waiting'));
    }

    let running = false;
    let calm = 0;
    let last = 0;
    let started = 0;
    let visible = true;

    const frame = (now) => {
      if (!running) return;
      const elapsed = now - started;
      bodies.forEach((b) => {
        if (!b.active && elapsed > b.delay) {
          b.active = true;
          b.el.classList.remove('is-waiting');
        }
      });
      const dt = Math.min(1 / 30, (now - last) / 1000 || 1 / 60);
      last = now;
      for (let s = 0; s < 3; s++) step(dt / 3);
      render();

      const moving = bodies.some((b) => b.drag || !b.active || Math.abs(b.vx) + Math.abs(b.vy) > 12);
      calm = moving ? 0 : calm + 1;
      if (calm > 40 || !visible) { running = false; return; }
      requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || !visible) return;
      running = true;
      calm = 0;
      last = performance.now();
      if (!started) started = last;
      requestAnimationFrame(frame);
    };

    // Drag and throw
    bodies.forEach((b) => {
      let offX = 0, offY = 0, lastX = 0, lastY = 0, lastT = 0;
      const local = (event) => {
        const rect = stage.getBoundingClientRect();
        return [event.clientX - rect.left, event.clientY - rect.top];
      };
      b.el.addEventListener('pointerdown', (event) => {
        if (!b.active) return;
        event.preventDefault();
        b.el.setPointerCapture(event.pointerId);
        const [px, py] = local(event);
        offX = px - b.x; offY = py - b.y;
        lastX = b.x; lastY = b.y; lastT = performance.now();
        b.drag = true; b.vx = 0; b.vy = 0;
        b.el.classList.add('is-dragging');
        stage.classList.add('is-played');
        wake();
      });
      b.el.addEventListener('pointermove', (event) => {
        if (!b.drag) return;
        const [px, py] = local(event);
        const now = performance.now();
        const t = Math.max(8, now - lastT) / 1000;
        b.x = Math.min(Math.max(px - offX, b.r), width - b.r);
        b.y = Math.min(Math.max(py - offY, b.r), floor - b.r);
        b.vx = b.vx * 0.4 + ((b.x - lastX) / t) * 0.6;
        b.vy = b.vy * 0.4 + ((b.y - lastY) / t) * 0.6;
        b.a += (b.x - lastX) / b.r * 0.3;
        lastX = b.x; lastY = b.y; lastT = now;
      });
      const release = () => {
        if (!b.drag) return;
        b.drag = false;
        if (performance.now() - lastT > 80) { b.vx = 0; b.vy = 0; } // held still: just drop
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > MAX_SPEED) { b.vx *= MAX_SPEED / speed; b.vy *= MAX_SPEED / speed; }
        b.el.classList.remove('is-dragging');
        wake();
      };
      b.el.addEventListener('pointerup', release);
      b.el.addEventListener('pointercancel', release);
    });

    new ResizeObserver(() => { measure(); render(); wake(); }).observe(stage);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    }).observe(stage);

    if (!reducedMotion) {
      // Start the drop once the headline has animated in.
      setTimeout(wake, 500);
    }
  }
})();
