// GMST Cloud — scroll & micro-interactions.
// IntersectionObserver reveals (zero-dep core); optional GSAP layer for parallax.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function splitText(el) {
  if (!el || el.dataset.splitDone) return;
  el.dataset.splitDone = '1';
  const lines = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = lines.map((lineHtml) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = lineHtml;
    const text = tmp.textContent;
    const chars = [...text].map((c) => (c === ' ' ? ' ' : `<span class="char">${c}</span>`)).join('');
    return `<span class="line">${chars}</span>`;
  }).join('');
  el.querySelectorAll('.char').forEach((c, i) => { c.style.transitionDelay = `${i * 20}ms`; });
}

export function initReveals() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-reveal], [data-split]').forEach((el) => {
    if (el.hasAttribute('data-split')) splitText(el);
    if (reduce) { el.classList.add('in'); return; }
    io.observe(el);
  });
}

export function initMagnetic() {
  if (reduce || matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

export function initTilt() {
  if (reduce || matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.transform = `perspective(800px) rotateX(${(py - 0.5) * -5}deg) rotateY(${(px - 0.5) * 5}deg)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

// Scrollspy: highlight the current section in the nav.
export function initScrollSpy() {
  const links = [...document.querySelectorAll('.nav__links a')];
  const map = new Map();
  links.forEach((a) => { const id = a.getAttribute('href').slice(1); const s = document.getElementById(id); if (s) map.set(s, a); });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        map.get(e.target)?.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, s) => io.observe(s));
}

export async function initGsap() {
  if (reduce) return;
  let gsap, ScrollTrigger;
  try {
    ({ gsap } = await import('gsap'));
    ({ ScrollTrigger } = await import('gsap/ScrollTrigger'));
    gsap.registerPlugin(ScrollTrigger);
  } catch { return; }

  // hero copy drifts as you scroll past (shead reveals are handled by
  // IntersectionObserver in initReveals — don't double-animate them here)
  gsap.to('.hero__inner', {
    yPercent: -10, opacity: 0.55, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

export default { initReveals, initMagnetic, initTilt, initScrollSpy, initGsap, splitText };
