// GMST Cloud — hero canvas.
// A drifting particle network ("the cloud"): nodes float, nearby nodes link
// with fading lines, and the pointer gently pulls them. Pure Canvas 2D, no
// dependencies, DPR-aware, pauses when offscreen, respects reduced-motion.

export function initCloudField(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLORS = ['#22d3ee', '#3b82f6', '#a78bfa', '#34d399'];
  let dpr = Math.min(devicePixelRatio || 1, 2);
  let w = 0, h = 0;
  let nodes = [];
  const pointer = { x: -9999, y: -9999, active: false };

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    // density scales with area, capped for performance
    const count = Math.min(120, Math.max(36, Math.round((w * h) / 14000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    }));
  }

  const LINK = 130;
  function step() {
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      // wrap around edges
      if (n.x < -20) n.x = w + 20; if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20; if (n.y > h + 20) n.y = -20;

      // pointer attraction
      if (pointer.active) {
        const dx = pointer.x - n.x, dy = pointer.y - n.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 200 * 200) {
          const f = (1 - Math.sqrt(d2) / 200) * 0.04;
          n.vx += dx * f * 0.01; n.vy += dy * f * 0.01;
        }
      }
      // mild damping to keep speeds sane
      n.vx *= 0.995; n.vy *= 0.995;
    }

    // links
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK) {
          const alpha = (1 - dist / LINK) * 0.5;
          ctx.strokeStyle = `rgba(90,160,230,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    // nodes
    for (const n of nodes) {
      ctx.beginPath();
      ctx.fillStyle = n.c;
      ctx.shadowColor = n.c; ctx.shadowBlur = 8;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  let raf, visible = true;
  function loop() { raf = requestAnimationFrame(loop); if (visible) step(); }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  window.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
    pointer.active = pointer.y >= 0 && pointer.y <= h;
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.active = false; });

  resize();
  if (reduce) { step(); return; } // one static frame
  loop();
}

export default initCloudField;
