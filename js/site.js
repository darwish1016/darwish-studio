/* ==========================================================================
   Omar Darwish — portfolio interactions
   No libraries. The page is complete without JS; this adds the mobile menu,
   the fitted hero name, scroll reveals, hero parallax, stacking project
   cards, the services image swap, a smooth FAQ, and the contact form.
   ========================================================================== */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  const menu = $('#menu');
  const menuBtn = $('[data-menu-toggle]');
  const setMenu = (open) => {
    if (!menu || !menuBtn) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
  };
  menuBtn?.addEventListener('click', () => setMenu(menu.hidden));

  /* ---------- Sticky header: the frosted pill shows once the page has scrolled ---------- */
  const nav = $('.nav');
  if (nav) {
    const onNav = () => nav.classList.toggle('is-stuck', scrollY > 8);
    addEventListener('scroll', onNav, { passive: true });
    onNav();
  }
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
  matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Hero name fills the container width exactly ---------- */
  const fitEls = $$('[data-fit]');
  const fit = () => fitEls.forEach((el) => {
    const span = el.firstElementChild;
    // data-fit="wrap": on phones let long names wrap instead of shrinking to fit one line
    const wrap = el.dataset.fit === 'wrap' && innerWidth < 760;
    el.classList.toggle('is-wrapped', wrap);
    if (wrap) { el.style.fontSize = ''; return; }
    el.style.fontSize = '100px';
    const w = span.getBoundingClientRect().width;
    const avail = el.clientWidth;
    if (w) el.style.fontSize = `${Math.floor(100 * avail / w * 10) / 10}px`;
  });
  fit();
  addEventListener('resize', fit);
  document.fonts?.ready.then(fit);

  /* ---------- Reveals ---------- */
  const reveal = (els, opts) => {
    if (!('IntersectionObserver' in window) || reduce) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), opts);
    els.forEach((el) => io.observe(el));
  };
  reveal($$('[data-title]'), { rootMargin: '0px 0px -12% 0px' });
  reveal($$('[data-reveal]'), { rootMargin: '0px 0px -6% 0px' });
  // the hero (name, intro line and photo card) animates in on load, without waiting for scroll
  setTimeout(() => $$('.hero [data-rise], [data-fit]').forEach((el) => el.classList.add('is-in')), 60);
  reveal($$('[data-rise]:not(.hero [data-rise])'), { rootMargin: '0px 0px -6% 0px' });

  /* ---------- About: words darken as you read ---------- */
  const words = $('[data-words]');
  if (words) {
    words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('.w', words);
    const paint = () => {
      const r = words.getBoundingClientRect();
      const start = innerHeight * 0.9, end = innerHeight * 0.4;
      const p = Math.min(Math.max((start - r.top) / (r.height + start - end), 0), 1);
      const lit = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('is-on', i < lit));
    };
    if (reduce) spans.forEach((s) => s.classList.add('is-on'));
    else { addEventListener('scroll', paint, { passive: true }); addEventListener('resize', paint); paint(); }
  }

  /* ---------- Scroll-driven effects: hero parallax + stacking cards ---------- */
  const photo = $('[data-parallax]');
  const cards = $$('[data-stack]');
  if (!reduce) {
    let ticking = false;
    const update = () => {
      ticking = false;
      if (photo) {
        const r = photo.parentElement.getBoundingClientRect();
        const p = Math.min(Math.max(1 - r.bottom / (innerHeight + r.height), 0), 1);   // 0 → 1 while the pill passes
        photo.style.transform = photo.dataset.parallax === 'zoom'
          ? `scale(${(1.02 + p * .1).toFixed(3)})`   // screenshots: zoom only, so no edge ever shows
          : `translateY(${(p * 10).toFixed(2)}%) scale(${(1.03 + p * .07).toFixed(3)})`;
      }
      // each card grows from 90% to full size as it rises into its sticky spot,
      // then eases back a little while the next card slides over it
      cards.forEach((card, i) => {
        const item = card.parentElement;
        const r = item.getBoundingClientRect();
        const enter = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.75), 0), 1);
        let scale = 0.9 + enter * 0.1;
        const next = cards[i + 1]?.parentElement;
        if (next) {
          const nr = next.getBoundingClientRect();
          const cover = Math.min(Math.max((innerHeight - nr.top) / innerHeight, 0), 1);
          scale -= cover * 0.05;
        }
        card.style.transform = `scale(${scale.toFixed(4)})`;
      });
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  }

  /* ---------- Endless review rail: repeat the cards once so the loop is seamless ---------- */
  $$('.reviews__track').forEach((track) => {
    [...track.children].forEach((card) => {
      const copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
  });

  /* ---------- Services: hovering a service swaps the image ---------- */
  const svcItems = $$('[data-svc]');
  const svcImgs = $$('[data-svc-img]');
  const showSvc = (n) => {
    svcItems.forEach((li) => li.classList.toggle('is-on', li.dataset.svc === n));
    svcImgs.forEach((img) => img.classList.toggle('is-on', img.dataset.svcImg === n));
  };
  svcItems.forEach((li) => {
    li.addEventListener('pointerenter', () => showSvc(li.dataset.svc));
    li.addEventListener('focusin', () => showSvc(li.dataset.svc));
  });
  if (svcItems.length) showSvc('0');

  /* ---------- FAQ: one open at a time, with a smooth height animation ---------- */
  const items = $$('.faq__item');
  items.forEach((d) => {
    const summary = $('summary', d);
    const body = $('.faq__a', d);
    summary.addEventListener('click', (e) => {
      if (reduce || !body.animate) return;
      e.preventDefault();
      const opening = !d.open;
      if (opening) items.forEach((o) => { if (o !== d && o.open) { o.open = false; } });
      if (opening) {
        d.open = true;
        const h = body.scrollHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
      } else {
        const h = body.scrollHeight;
        const a = body.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
        a.onfinish = () => { d.open = false; };
      }
    });
  });

  /* ---------- Contact form (FormSubmit) ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const button = $('button[type="submit"]', form);
    const label = button.innerHTML;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Sending…';
    status.className = 'form__status';
    status.textContent = 'Sending your message…';
    try {
      const endpoint = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      const response = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success === false || result.success === 'false') throw new Error(result.message || 'Message not sent');
      form.reset();
      status.classList.add('is-ok');
      status.textContent = 'Thanks! Your message is on its way. I’ll get back to you soon.';
    } catch (error) {
      console.error('FormSubmit error:', error);
      status.classList.add('is-error');
      status.textContent = 'Sorry, that didn’t send. Please email me at omarnacilla@gmail.com.';
    } finally {
      button.removeAttribute('aria-busy');
      button.innerHTML = label;
    }
  });

  /* ---------- Page transition between the homepage and case studies ---------- */
  const titles = {
    'index': 'Omar Darwish', '': 'Omar Darwish',
    'sebu-sanctuary': 'Sebu Sanctuary', 'levels-it': 'Levels IT', 'homelend': 'Homelend Solutions',
    'ignite-training': 'Ignite Training', 'callaughan-partners': 'Callaughan Partners', 'seek-consciousness': 'Seek Consciousness',
  };
  const pageKey = (url) => url.pathname.split('/').pop().replace(/\.html$/, '');
  const curtain = document.createElement('div');
  curtain.className = 'curtain no-anim';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<p class="curtain__title"></p>';
  document.body.appendChild(curtain);
  const curtainTitle = $('.curtain__title', curtain);

  // arriving: start covered, then lift the curtain away
  let arriving = null;
  try { arriving = sessionStorage.getItem('pt-title'); sessionStorage.removeItem('pt-title'); } catch (e) {}
  if (arriving && !reduce) {
    curtainTitle.textContent = arriving;
    curtain.classList.add('is-covering');
    document.documentElement.classList.remove('pt-arrive');
    // timers, not requestAnimationFrame: rAF can stall in a background tab and leave the page covered
    void curtain.offsetHeight;
    curtain.classList.remove('no-anim');
    setTimeout(() => curtain.classList.add('is-leaving'), 250);
    setTimeout(() => { curtain.classList.remove('is-covering', 'is-leaving'); curtain.classList.add('no-anim'); }, 1100);
  } else {
    document.documentElement.classList.remove('pt-arrive');
    void curtain.offsetHeight;
    curtain.classList.remove('no-anim');
  }

  // leaving: cover the page, then go
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname) return;   // same page (hash links) scrolls as normal
    const key = pageKey(url);
    if (!(key in titles)) return;
    e.preventDefault();
    try { sessionStorage.setItem('pt-title', titles[key]); } catch (err) {}
    curtainTitle.textContent = titles[key];
    curtain.classList.remove('no-anim', 'is-leaving');
    curtain.classList.add('is-covering');
    setTimeout(() => { location.href = url.href; }, 750);
  });
  // coming back with the browser's back button: never leave the curtain up
  addEventListener('pageshow', (e) => { if (e.persisted) { curtain.classList.add('no-anim'); curtain.classList.remove('is-covering', 'is-leaving'); } });

  /* ---------- Live clock (General Santos time in the footer) ---------- */
  const clocks = $$('[data-clock]');
  if (clocks.length) {
    const fmts = clocks.map((el) => new Intl.DateTimeFormat('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: el.dataset.clock }));
    const tick = () => clocks.forEach((el, i) => { el.textContent = fmts[i].format(new Date()).replace(/\s?([ap])\.?m\.?/i, ' $1m'); });
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
