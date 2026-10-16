/* ARoL Service – page behaviour */
(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const noHover = window.matchMedia('(hover: none)');

  /* ---------- Sticky header ---------- */
  const shell = document.querySelector('.header-shell');
  const header = document.getElementById('site-header');
  const toTop = document.querySelector('[data-to-top]');

  function measureHeader() {
    const stuck = header.classList.contains('is-stuck');
    header.classList.remove('is-stuck');
    shell.style.height = header.offsetHeight + 'px';
    if (stuck) header.classList.add('is-stuck');
  }

  function onScroll() {
    const y = window.scrollY;
    const top = shell.offsetTop;
    const stuck = header.classList.contains('is-stuck');
    if (!stuck && y > top + shell.offsetHeight + 40) {
      header.classList.add('is-stuck', 'is-entering');
    } else if (stuck && y <= top) {
      header.classList.remove('is-stuck', 'is-entering');
    }
    toTop.classList.toggle('is-visible', y > 600);
  }

  header.addEventListener('animationend', () => header.classList.remove('is-entering'));
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  measureHeader();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measureHeader);
  document.fonts?.ready.then(measureHeader);

  /* ---------- Mobile navigation ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.classList.toggle('is-open', open);
  }
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', e => {
    if (nav.classList.contains('is-open') && !header.contains(e.target)) setMenu(false);
  });

  /* ---------- Active nav link ---------- */
  const links = [...nav.querySelectorAll('a')];
  const targets = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => {
        if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(t => spy.observe(t));

  /* ---------- Reveal on scroll ---------- */
  const revealables = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: .15 });
    revealables.forEach(el => io.observe(el));
  }

  /* ---------- Hero slider ---------- */
  const hero = document.querySelector('[data-slider]');
  const slides = [...hero.querySelectorAll('.slide')];
  const dots = [...hero.querySelectorAll('.hero__dots button')];
  const INTERVAL = 6500;
  let current = 0;
  let timer = null;

  function show(n) {
    const next = (n + slides.length) % slides.length;
    if (next === current) return;
    [current, next].forEach((i, k) => {
      const active = k === 1;
      slides[i].classList.toggle('is-active', active);
      slides[i].toggleAttribute('inert', !active);
      if (active) slides[i].removeAttribute('aria-hidden');
      else slides[i].setAttribute('aria-hidden', 'true');
      if (active) dots[i].setAttribute('aria-current', 'true');
      else dots[i].removeAttribute('aria-current');
    });
    current = next;
  }

  function stop() { clearInterval(timer); timer = null; }
  function play() {
    if (reduceMotion) return;
    stop();
    timer = setInterval(() => show(current + 1), INTERVAL);
  }
  function step(delta) { show(current + delta); play(); }

  hero.querySelector('[data-prev]').addEventListener('click', () => step(-1));
  hero.querySelector('[data-next]').addEventListener('click', () => step(1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); play(); }));

  hero.addEventListener('mouseenter', stop);
  hero.addEventListener('mouseleave', play);
  hero.addEventListener('focusin', stop);
  hero.addEventListener('focusout', e => { if (!hero.contains(e.relatedTarget)) play(); });
  hero.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  let startX = null;
  hero.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') startX = e.clientX; });
  hero.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
  hero.addEventListener('pointercancel', () => { startX = null; });

  play();

  /* ---------- Slide 2 mosaic (stand-in for the people collage) ---------- */
  const mosaic = document.querySelector('[data-mosaic]');
  if (mosaic) {
    let seed = 7;
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const palette = ['#c9a88a', '#8a6f5a', '#d9c2a7', '#6f8fa8', '#a8b8c8', '#e3d5c4', '#5d6b7a',
      '#b48c6e', '#9fb0a0', '#e8e0d6', '#7a5c48', '#c2cfd9', '#d6b49a', '#4f6378', '#efe6da'];
    const pick = () => palette[Math.floor(rand() * palette.length)];
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 170; i++) {
      const tile = document.createElement('span');
      const r = rand();
      if (r < .1) tile.style.gridArea = 'span 2 / span 2';
      else if (r < .2) tile.style.gridRow = 'span 2';
      tile.style.background = `linear-gradient(${Math.floor(rand() * 360)}deg, ${pick()}, ${pick()})`;
      frag.appendChild(tile);
    }
    mosaic.appendChild(frag);
  }

  /* ---------- Touch: tap to reveal patent status / flip agreements ---------- */
  const patents = [...document.querySelectorAll('.patent')];
  patents.forEach(card => card.addEventListener('click', () => {
    if (!noHover.matches) return;
    const open = !card.classList.contains('is-open');
    patents.forEach(c => c.classList.remove('is-open'));
    card.classList.toggle('is-open', open);
    if (!open) card.blur();
  }));

  document.querySelectorAll('.deal').forEach(deal => {
    // Keyboard focus flips via :focus-visible; touch needs an explicit toggle.
    deal.addEventListener('click', () => { if (noHover.matches) deal.classList.toggle('is-flipped'); });
    deal.addEventListener('blur', () => deal.classList.remove('is-flipped'));
  });

  /* ---------- Footer year ---------- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
