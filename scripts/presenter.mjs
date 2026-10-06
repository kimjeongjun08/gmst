// GMST Cloud — presentation mode + section navigation.
// Treats each <section> like a slide: keyboard ←/→ · PageUp/Down · Home/End to
// move, side dots to jump, and a "발표 모드" that snaps one section per screen
// with a prev / "n / total" / next control bar. Press P or F to toggle, Esc to exit.

const LABELS = {
  hero: '시작', agenda: '순서', about: '클라우드란', analogy: '쉽게 말하면',
  benefits: '장점', life: '우리의 일상', career: '진로', curriculum: '커리큘럼',
  awards: '수상·혜택', join: '지원',
};

export function initPresenter() {
  const sections = [...document.querySelectorAll('main > section')];
  if (!sections.length) return;
  const root = document.documentElement;
  let current = 0;

  // ── side dots ──
  const dots = document.createElement('nav');
  dots.className = 'dots';
  dots.setAttribute('aria-label', '섹션 바로가기');
  sections.forEach((sec, i) => {
    const label = LABELS[sec.id] || sec.querySelector('.shead__kicker')?.textContent || `${i + 1}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.label = label;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => goTo(i));
    dots.appendChild(b);
  });
  document.body.appendChild(dots);
  const dotBtns = [...dots.children];

  // ── presentation control bar ──
  const bar = document.createElement('div');
  bar.className = 'present-bar';
  bar.innerHTML = `
    <button type="button" data-prev aria-label="이전">‹</button>
    <span class="present-bar__count" data-count>1 / ${sections.length}</span>
    <button type="button" data-next aria-label="다음">›</button>
    <button type="button" class="present-bar__exit" data-exit aria-label="발표 모드 종료">✕</button>`;
  document.body.appendChild(bar);
  const countEl = bar.querySelector('[data-count]');
  bar.querySelector('[data-prev]').addEventListener('click', () => go(-1));
  bar.querySelector('[data-next]').addEventListener('click', () => go(1));
  bar.querySelector('[data-exit]').addEventListener('click', () => setPresent(false));

  // ── keyboard hint ──
  const hint = document.createElement('div');
  hint.className = 'kbhint';
  hint.innerHTML = `<kbd>←</kbd><kbd>→</kbd> 이동 · <kbd>P</kbd> 발표 모드`;
  document.body.appendChild(hint);
  const hideHint = () => hint.classList.add('hide');
  setTimeout(hideHint, 7000);

  // ── current-section tracking ──
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      current = sections.indexOf(e.target);
      dotBtns.forEach((d, i) => d.classList.toggle('active', i === current));
      if (countEl) countEl.textContent = `${current + 1} / ${sections.length}`;
    });
  }, { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' });
  sections.forEach((s) => io.observe(s));

  // ── navigation ──
  function goTo(i) {
    current = Math.max(0, Math.min(i, sections.length - 1));
    sections[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function go(dir) { goTo(current + dir); hideHint(); }

  // ── presentation mode ──
  function setPresent(on) {
    root.classList.toggle('presenting', on);
    const btn = document.querySelector('[data-present-toggle]');
    btn?.setAttribute('aria-pressed', String(on));
    if (btn) btn.textContent = on ? '발표 종료' : '발표 모드';
    if (on) { hideHint(); requestAnimationFrame(() => sections[current].scrollIntoView({ block: 'start' })); }
  }
  function togglePresent() { setPresent(!root.classList.contains('presenting')); }
  document.querySelector('[data-present-toggle]')?.addEventListener('click', togglePresent);

  // ── keyboard ──
  addEventListener('keydown', (e) => {
    if (e.target.matches?.('input, textarea, select')) return;
    const k = e.key;
    const presenting = root.classList.contains('presenting');
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); go(1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(-1); }
    else if (k === 'Home') { e.preventDefault(); goTo(0); }
    else if (k === 'End') { e.preventDefault(); goTo(sections.length - 1); }
    else if (k === 'p' || k === 'P' || k === 'f' || k === 'F') { e.preventDefault(); togglePresent(); }
    else if (k === 'Escape' && presenting) { setPresent(false); }
    else if (presenting && (k === ' ' || k === 'Enter')) { e.preventDefault(); go(1); }
  });

  // expose for the nav button fallback
  return { goTo, go, setPresent };
}

export default initPresenter;
