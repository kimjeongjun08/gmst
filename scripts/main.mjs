// GMST Cloud — entry point.
// Preloader, custom cursor, nav, content rendering (apps/careers/curriculum),
// count-up stats, confetti, and the join CTA. Pure static, no backend needed.

import { initCloudField } from './hero.mjs';
import { initReveals, initMagnetic, initTilt, initScrollSpy, initGsap } from './scroll.mjs';
import { initPresenter } from './presenter.mjs';
import { initGlossary } from './glossary.mjs';

const $ = (s, r = document) => r.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const nf = new Intl.NumberFormat('ko-KR');

// ── Preloader ─────────────────────────────────────────────
function runPreloader() {
  const el = $('#preloader'); const pct = $('[data-pct]'); const fill = $('[data-barfill]');
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + Math.random() * 20);
      if (pct) pct.textContent = Math.floor(p) + '%';
      if (fill) fill.style.width = p + '%';
      if (p >= 100) { clearInterval(t); setTimeout(() => { el.classList.add('done'); resolve(); }, 300); }
    }, 130);
  });
}

// ── Nav + scroll rail ─────────────────────────────────────
function initNav() {
  const nav = $('[data-nav]'); const fill = $('[data-scrollfill]');
  const onScroll = () => {
    nav?.classList.toggle('scrolled', scrollY > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (fill) fill.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

// ── Content rendering ─────────────────────────────────────
async function render() {
  const [careers, curriculum] = await Promise.all([
    fetch('data/careers.json').then((r) => r.json()).catch(() => []),
    fetch('data/curriculum.json').then((r) => r.json()).catch(() => []),
  ]);

  const careersEl = $('[data-careers]');
  if (careersEl) careersEl.innerHTML = careers.map((c) => `
    <article class="ccard" data-tilt data-reveal>
      <h3>${c.title}</h3>
      <p>${c.desc}</p>
      <div class="ccard__tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>
    </article>`).join('');

  const tlEl = $('[data-timeline]');
  if (tlEl) tlEl.innerHTML = curriculum.map((y) => `
    <li class="tl" data-reveal>
      <div class="tl__year">${y.year}학년</div>
      <div class="tl__body">
        <h3>${y.title}</h3><p>${y.desc}</p>
        <ul>${y.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
    </li>`).join('');
}

// ── Count-up stats ────────────────────────────────────────
function initCounters() {
  const els = document.querySelectorAll('[data-count]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const target = +e.target.dataset.count;
      const suffix = e.target.dataset.suffix || '';
      if (reduce) { e.target.textContent = nf.format(target) + suffix; return; }
      const dur = 1400; const t0 = performance.now();
      (function tick(now) {
        const k = Math.min((now - t0) / dur, 1);
        const v = Math.round(target * (1 - Math.pow(1 - k, 3)));
        e.target.textContent = nf.format(v) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

// ── Boot ──────────────────────────────────────────────────
async function boot() {
  initNav();
  initCloudField($('[data-cloudfield]'));
  await render();            // build DOM from data before observing reveals
  await runPreloader();
  initReveals();
  initMagnetic();
  initTilt();
  initScrollSpy();
  initCounters();
  initGlossary();   // jargon tooltips (after render so tags exist)
  initPresenter();  // section nav + 발표 모드
  initGsap();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
