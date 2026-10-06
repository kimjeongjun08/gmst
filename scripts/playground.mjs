// GMST — 3과제 체험 플레이그라운드.
// 실제 REST API(server/)에 요청을 보내고 응답·지연시간을 보여줍니다.
// 백엔드가 없으면(배포된 정적 사이트 등) 브라우저 내 "데모 모드"로 동일하게 동작.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// ── API base 결정 ──
const cfg = window.GMST_CONFIG || {};
let API = String(cfg.apiBase || '').replace(/\/+$/, '');
if (!API && /^(localhost|127\.|0\.0\.0\.0|\[?::1)/.test(location.hostname)) API = 'http://localhost:4000';
let mode = 'checking'; // live | demo

// ── 요소 ──
const connEl = $('[data-conn]');
const reqLine = $('[data-reqline]');
const resEl = $('[data-res]');
const steps = new Set();

// ── 데모 모드용 인메모리 저장소 (서버와 동일 구조) ──
const now = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const store = {
  users: [
    { id: 1, name: '김클라우드', email: 'kim@gmst.kr', created_at: now() },
    { id: 2, name: '이서버', email: 'lee@gmst.kr', created_at: now() },
    { id: 3, name: '박데브옵스', email: 'park@gmst.kr', created_at: now() },
  ],
  products: [
    { id: 1, name: '오브젝트 스토리지 100GB', price: 3000, owner_id: 1, created_at: now() },
    { id: 2, name: '관리형 데이터베이스', price: 12000, owner_id: 2, created_at: now() },
    { id: 3, name: '로드밸런서 1대', price: 8000, owner_id: 3, created_at: now() },
  ],
  nu: 4, np: 4,
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mock({ method, path, query, body }) {
  const ms = Math.round(6 + Math.random() * 34);
  const R = (status, data) => ({ status, ok: status < 400, data, ms, demo: true });
  if (method === 'GET' && path === '/v1/user') return R(200, { count: store.users.length, items: store.users });
  if (method === 'POST' && path === '/v1/user') {
    const name = String(body?.name ?? '').trim();
    const email = String(body?.email ?? '').trim().toLowerCase();
    if (!name) return R(422, { error: 'name 은 필수입니다.' });
    if (!EMAIL_RE.test(email)) return R(422, { error: '올바른 email 이 필요합니다.' });
    if (store.users.some((u) => u.email === email)) return R(409, { error: '이미 존재하는 email 입니다.' });
    const user = { id: store.nu++, name, email, created_at: now() };
    store.users.push(user);
    return R(201, { ok: true, id: user.id, user });
  }
  if (method === 'GET' && path === '/v1/product') {
    const items = store.products.map((p) => ({ ...p, owner_name: store.users.find((u) => u.id === p.owner_id)?.name ?? null }));
    return R(200, { count: items.length, items });
  }
  if (method === 'POST' && path === '/v1/product') {
    const name = String(body?.name ?? '').trim();
    if (!name) return R(422, { error: 'name 은 필수입니다.' });
    const price = Math.max(0, Math.round(Number(body?.price) || 0));
    const owner = body?.ownerId != null ? Number(body.ownerId) : null;
    if (owner != null && !store.users.some((u) => u.id === owner)) return R(422, { error: '존재하지 않는 ownerId 입니다.' });
    store.products.push({ id: store.np, name, price, owner_id: owner, created_at: now() });
    return R(201, { ok: true, id: store.np++ });
  }
  if (method === 'GET' && path === '/v1/stress') {
    const n = Math.min(200, Math.max(1, Number(query?.n) || 20));
    const per = 0.3 + Math.random() * 0.6;
    const total = +(n * per).toFixed(2);
    return R(200, { requests: n, total_ms: total, avg_ms: +per.toFixed(3), p95_ms: +(per * 1.4).toFixed(3), rps: Math.round(n / (total / 1000)), note: '데모 모드: 브라우저 내 시뮬레이션 결과입니다.' });
  }
  return R(404, { error: 'Not Found', path });
}

async function send(spec) {
  const t0 = performance.now();
  if (mode !== 'live') { await new Promise((r) => setTimeout(r, 80 + Math.random() * 180)); return mock(spec); }
  const qs = spec.query ? '?' + new URLSearchParams(spec.query) : '';
  const res = await fetch(API + spec.path + qs, {
    method: spec.method,
    headers: spec.body ? { 'content-type': 'application/json' } : undefined,
    body: spec.body ? JSON.stringify(spec.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data, ms: Math.round(performance.now() - t0), demo: false };
}

// ── JSON 하이라이트 ──
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function highlight(obj) {
  const json = esc(JSON.stringify(obj, null, 2));
  return json
    .replace(/"([^"]+)":/g, '<span class="k">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g, ': <span class="n">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="b">$1</span>');
}

// ── 다이어그램 점등 ──
const NODES = {
  '/v1/user': { nodes: ['client', 'endpoint', 'user', 'rds'], edges: ['client', 'user', 'rdsU'] },
  '/v1/product': { nodes: ['client', 'endpoint', 'product', 'rds'], edges: ['client', 'product', 'rdsP'] },
  '/v1/stress': { nodes: ['client', 'endpoint', 'stress'], edges: ['client', 'stress'] },
};
function flash(path) {
  const map = NODES[path]; if (!map) return;
  const on = [];
  map.nodes.forEach((n) => { const el = $(`.pg-node[data-node="${n}"]`); if (el) { el.classList.add('hot'); on.push(el); } });
  map.edges.forEach((e) => { const el = $(`.pg-edge[data-edge="${e}"]`); if (el) { el.classList.add('hot'); on.push(el); } });
  // endpoint→service edge
  const svc = map.nodes.find((n) => ['user', 'product', 'stress'].includes(n));
  const sEdge = $(`.pg-edge[data-edge="${svc}"]`); if (sEdge) { sEdge.classList.add('hot'); on.push(sEdge); }
  setTimeout(() => on.forEach((el) => el.classList.remove('hot')), 1300);
}

// ── 스텝 체크 ──
const STEP = { 'GET /v1/user': 'users', 'POST /v1/user': 'adduser', 'GET /v1/product': 'products', 'GET /v1/stress': 'stress' };
function markStep(key) {
  const s = STEP[key]; if (!s || steps.has(s)) return;
  steps.add(s);
  $(`.pg-steps li[data-step="${s}"]`)?.classList.add('done');
  if (steps.size === 4) { burstConfetti(); setTimeout(() => { reqLine.innerHTML = '🎉 <b style="color:var(--mint)">체험 완료!</b> 방금 당신은 실제 REST API를 호출하고, 데이터를 만들고, 부하까지 측정했습니다 — 이게 바로 3과제가 만드는 것입니다.'; }, 300); }
}

// ── 요청 실행 ──
async function run(call, btn) {
  const [method, path] = call.split(' ');
  const spec = { method, path };
  if (call === 'POST /v1/user') spec.body = { name: $('[data-field="user-name"]').value, email: $('[data-field="user-email"]').value };
  if (call === 'POST /v1/product') spec.body = { name: $('[data-field="prod-name"]').value, price: $('[data-field="prod-price"]').value, ownerId: $('[data-field="prod-owner"]').value || null };
  if (call === 'GET /v1/stress') spec.query = { n: $('[data-field="stress-n"]').value };

  btn.disabled = true;
  reqLine.innerHTML = `<span class="m m--${method === 'GET' ? 'get' : 'post'}">${method}</span> ${esc(path)}${spec.query ? '?' + new URLSearchParams(spec.query) : ''} <span style="color:var(--text-mute)">요청 중…</span>`;
  flash(path);
  try {
    const r = await send(spec);
    const cls = r.ok ? 'ok' : 'err';
    reqLine.innerHTML = `<span class="m m--${method === 'GET' ? 'get' : 'post'}">${method}</span> ${esc(path)}`
      + ` <span class="status ${cls}">${r.status} ${r.ok ? 'OK' : 'ERR'} · <span class="lat">${r.ms}ms</span>${r.demo ? ' · demo' : ''}</span>`;
    resEl.innerHTML = highlight(r.data);
    if (r.ok) markStep(call);
  } catch (e) {
    reqLine.innerHTML = `<span class="status err">요청 실패</span> — 서버에 연결할 수 없습니다.`;
    resEl.textContent = String(e.message);
  } finally { btn.disabled = false; }
}

// ── 연결 상태 확인 ──
async function checkHealth() {
  if (!API) { setMode('demo'); return; }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(API + '/v1/health', { signal: ctrl.signal });
    clearTimeout(t);
    setMode(res.ok ? 'live' : 'demo');
  } catch { setMode('demo'); }
}
function setMode(m) {
  mode = m;
  connEl.dataset.state = m;
  connEl.innerHTML = m === 'live'
    ? `<i></i> 실시간 서버 연결됨`
    : `<i></i> 데모 모드 (브라우저 내 시뮬레이션)`;
}

// ── 컨페티 ──
let craf;
function burstConfetti() {
  const canvas = $('[data-confetti]'); if (!canvas) return;
  const ctx = canvas.getContext('2d'); const dpr = Math.min(devicePixelRatio, 2);
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
  const colors = ['#22d3ee', '#3b82f6', '#a78bfa', '#34d399', '#fbbf24'];
  const parts = Array.from({ length: 140 }, () => ({ x: canvas.width / 2, y: canvas.height * 0.3, vx: (Math.random() - 0.5) * 18 * dpr, vy: (Math.random() - 1) * 16 * dpr, g: 0.4 * dpr, life: 1, size: (2 + Math.random() * 4) * dpr, c: colors[(Math.random() * 5) | 0], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3 }));
  cancelAnimationFrame(craf);
  (function d() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); let alive = false;
    for (const p of parts) { p.vy += p.g; p.x += p.vx; p.y += p.vy; p.life -= 0.012; p.rot += p.vr; if (p.life <= 0) continue; alive = true; ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); ctx.restore(); }
    if (alive) craf = requestAnimationFrame(d); else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })();
}

// ── 초기화 ──
$$('[data-call]').forEach((btn) => btn.addEventListener('click', () => run(btn.dataset.call, btn)));
const stressN = $('[data-field="stress-n"]'); const stressOut = $('[data-stress-out]');
stressN?.addEventListener('input', () => { stressOut.textContent = stressN.value; });
checkHealth();
