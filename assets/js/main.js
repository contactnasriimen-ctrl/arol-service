/* ARoL Service – page behaviour (luxury edition) */
(() => {
  'use strict';

  document.documentElement.classList.add('js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const INTRO_MS = reduceMotion ? 0 : 1350;

  /* ---------- Header ---------- */
  const siteTop = document.querySelector('[data-site-top]');
  const onScroll = () => siteTop.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Theme switch (light default, dark on request) ---------- */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function setTheme(theme, persist) {
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeMeta.setAttribute('content', theme === 'dark' ? '#04060b' : '#f6f1e8');
    if (persist) { try { localStorage.setItem('arol-theme', theme); } catch (e) { /* private mode */ } }
    document.dispatchEvent(new CustomEvent('arol:theme', { detail: theme }));
  }
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light', false);
  themeToggle.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  /* ---------- Mobile menu ---------- */
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-menu]');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('is-locked', open);
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 1181px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* ---------- Active nav link ---------- */
  const links = [...document.querySelectorAll('.nav a')];
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => {
        if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t) spy.observe(t); });

  /* ---------- Reveal on scroll + counters ---------- */
  document.querySelectorAll('[data-stagger]').forEach(group => {
    [...group.children].forEach((el, i) => el.style.setProperty('--i', i % 5));
  });

  function countUp(el) {
    const num = el.querySelector('[data-count]');
    if (!num) return;
    const target = Number(num.dataset.count);
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / 1800, 1);
      num.textContent = Math.round(target * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(tick);
    };
    num.textContent = '0';
    requestAnimationFrame(tick);
  }

  const revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        countUp(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealables.forEach(el => io.observe(el));
  }

  /* ---------- Hero taglines ---------- */
  const hero = document.querySelector('.hero');
  const heroText = hero.querySelector('.hero__text');
  const taglines = [...hero.querySelectorAll('.tagline')];
  const currentEl = hero.querySelector('[data-current]');
  const progressEl = hero.querySelector('[data-progress]');
  const INTERVAL = 7000;

  // Wrap every word of the headings in a mask so it can slide in
  function wrapWord(content, i) {
    const outer = document.createElement('span');
    const inner = document.createElement('span');
    outer.className = 'w';
    inner.style.setProperty('--i', i);
    inner.append(content);
    outer.append(inner);
    return outer;
  }
  taglines.forEach(tagline => {
    const heading = tagline.querySelector('h1, h2');
    let i = 0;
    (function walk(node) {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            frag.append(/^\s+$/.test(part) ? document.createTextNode(' ') : wrapWord(part, i++));
          });
          child.replaceWith(frag);
        } else if (child.nodeName === 'SMALL') {
          child.replaceWith(wrapWord(child.cloneNode(true), i++));
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          walk(child);
        }
      });
    })(heading);
  });

  let index = 0;
  let elapsed = -INTRO_MS;
  let paused = false;
  let heroVisible = true;

  function show(n) {
    const next = (n + taglines.length) % taglines.length;
    if (next === index) return;
    const prev = taglines[index];
    prev.classList.remove('is-active');
    prev.classList.add('is-leaving');
    clearTimeout(prev._leave);
    prev._leave = setTimeout(() => prev.classList.remove('is-leaving'), 1000);

    const incoming = taglines[next];
    clearTimeout(incoming._leave);
    incoming.classList.remove('is-leaving');
    incoming.classList.add('is-active');
    taglines.forEach((t, i) => t.setAttribute('aria-hidden', String(i !== next)));

    index = next;
    elapsed = 0;
    currentEl.textContent = String(next + 1).padStart(2, '0');
  }

  // Play the first headline once the intro curtain lifts
  taglines[0].classList.remove('is-active');
  taglines.slice(1).forEach(t => t.setAttribute('aria-hidden', 'true'));
  setTimeout(() => taglines[0].classList.add('is-active'), INTRO_MS);

  let last = performance.now();
  (function loop(now) {
    const dt = now - last;
    last = now;
    if (!paused && heroVisible && !document.hidden && !reduceMotion) {
      elapsed += dt;
      if (elapsed >= INTERVAL) show(index + 1);
    }
    progressEl.style.transform = `scaleX(${Math.max(0, Math.min(elapsed / INTERVAL, 1))})`;
    requestAnimationFrame(loop);
  })(last);

  hero.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  hero.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
  heroText.addEventListener('mouseenter', () => { paused = true; });
  heroText.addEventListener('mouseleave', () => { paused = false; });
  heroText.addEventListener('focusin', () => { paused = true; });
  heroText.addEventListener('focusout', e => { if (!heroText.contains(e.relatedTarget)) paused = false; });
  heroText.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; }).observe(hero);

  /* ---------- Pointer depth: hero floats, tilt cards, luxury cards ---------- */
  if (finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      hero.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
      hero.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--px', 0);
      hero.style.setProperty('--py', 0);
    });

    const track = (el, max, extra) => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--rx', `${((0.5 - y) * max).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${((x - 0.5) * max).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        if (extra) el.style.setProperty('--mxn', x.toFixed(3));
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };
    document.querySelectorAll('[data-tilt]').forEach(el => track(el, el.classList.contains('pcard') ? 12 : 7));
    document.querySelectorAll('.lux-card').forEach(card => track(card, 16, true));
  }

  /* ---------- Agreement cards: flip ---------- */
  document.querySelectorAll('.lux-card').forEach(card => {
    const toggle = card.querySelector('.lux-card__toggle');
    toggle.addEventListener('click', () => {
      const on = !card.classList.contains('is-flipped');
      card.classList.toggle('is-flipped', on);
      toggle.setAttribute('aria-pressed', String(on));
    });
  });

  /* ---------- Patent footprint: region filter ---------- */
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const patentCards = [...document.querySelectorAll('.pcard')];
  filterButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filterButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let n = 0;
    patentCards.forEach(card => {
      const match = filter === 'all' || card.dataset.region === filter;
      card.hidden = !match;
      card.classList.remove('is-entering');
      if (!match) return;
      card.classList.add('is-visible');
      if (reduceMotion) return;
      card.style.setProperty('--n', n++);
      void card.offsetWidth; // restart the entrance animation
      card.classList.add('is-entering');
      card.addEventListener('animationend', () => card.classList.remove('is-entering'), { once: true });
    });
  }));

  /* ---------- Footer year ---------- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
