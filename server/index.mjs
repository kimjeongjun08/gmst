// 3과제 체험용 REST API 서버 (의존성 0 — node:http + node:sqlite)
//   GET  /v1/health
//   GET  /v1/user            목록      GET /v1/user/:id   단건
//   POST /v1/user            {name,email}
//   GET  /v1/product         목록(+owner 이름 JOIN)
//   POST /v1/product         {name,price,ownerId}
//   GET  /v1/stress?n=20     DB에 n번 질의하는 부하 테스트 → 지연시간 리포트
//
//   node server/index.mjs   (Node 22.5+)

import { createServer } from 'node:http';
import DB from './db.mjs';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '0.0.0.0';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRESS_MAX = 200;

function json(res, status, body) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('payload too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { if (!chunks.length) return resolve({}); try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('invalid json')); } });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  if (method === 'OPTIONS') { json(res, 204, {}); return; }

  try {
    // --- health ---
    if (method === 'GET' && (path === '/v1/health' || path === '/')) {
      return json(res, 200, { status: 'ok', ...DB.count(), ts: new Date().toISOString() });
    }

    // --- users ---
    if (method === 'GET' && path === '/v1/user') {
      return json(res, 200, { count: DB.users().length, items: DB.users() });
    }
    const um = path.match(/^\/v1\/user\/(\d+)$/);
    if (method === 'GET' && um) {
      const u = DB.user(Number(um[1]));
      return u ? json(res, 200, u) : json(res, 404, { error: '해당 사용자를 찾을 수 없습니다.' });
    }
    if (method === 'POST' && path === '/v1/user') {
      const b = await readBody(req);
      const name = String(b.name ?? '').trim();
      const email = String(b.email ?? '').trim().toLowerCase();
      if (!name) return json(res, 422, { error: 'name 은 필수입니다.' });
      if (!EMAIL_RE.test(email)) return json(res, 422, { error: '올바른 email 이 필요합니다.' });
      try {
        const id = DB.addUser(name, email);
        return json(res, 201, { ok: true, id, user: DB.user(id) });
      } catch (e) {
        if (String(e.message).includes('UNIQUE')) return json(res, 409, { error: '이미 존재하는 email 입니다.' });
        throw e;
      }
    }

    // --- products ---
    if (method === 'GET' && path === '/v1/product') {
      return json(res, 200, { count: DB.products().length, items: DB.products() });
    }
    if (method === 'POST' && path === '/v1/product') {
      const b = await readBody(req);
      const name = String(b.name ?? '').trim();
      const price = Math.max(0, Math.round(Number(b.price) || 0));
      const owner = b.ownerId != null ? Number(b.ownerId) : null;
      if (!name) return json(res, 422, { error: 'name 은 필수입니다.' });
      if (owner != null && !DB.user(owner)) return json(res, 422, { error: '존재하지 않는 ownerId 입니다.' });
      const id = DB.addProduct(name, price, owner);
      return json(res, 201, { ok: true, id });
    }

    // --- stress (부하 테스트) ---
    if (method === 'GET' && path === '/v1/stress') {
      const n = Math.min(STRESS_MAX, Math.max(1, Number(url.searchParams.get('n')) || 20));
      const t0 = performance.now();
      const lat = [];
      for (let i = 0; i < n; i++) {
        const s = performance.now();
        DB.ping.get();                 // 실제 DB 질의
        let x = 0; for (let k = 0; k < 20000; k++) x += Math.sqrt(k); // 약간의 연산 부하
        lat.push(performance.now() - s);
      }
      const total = performance.now() - t0;
      lat.sort((a, b) => a - b);
      return json(res, 200, {
        requests: n,
        total_ms: +total.toFixed(2),
        avg_ms: +(total / n).toFixed(3),
        p95_ms: +lat[Math.floor(n * 0.95) - 1 < 0 ? 0 : Math.floor(n * 0.95) - 1].toFixed(3),
        rps: Math.round(n / (total / 1000)),
        note: '서버가 요청 n건을 처리하며 DB 질의 + 연산을 수행한 실제 지연시간입니다.',
      });
    }

    return json(res, 404, { error: 'Not Found', path, hint: 'GET /v1/user, /v1/product, /v1/stress 를 사용하세요.' });
  } catch (e) {
    return json(res, 500, { error: 'internal error', detail: String(e.message) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  ☁ GMST 3과제 체험 API`);
  console.log(`  ├─ http   http://localhost:${PORT}`);
  console.log(`  ├─ routes /v1/user · /v1/product · /v1/stress · /v1/health`);
  console.log(`  └─ db     node:sqlite (relational) · 의존성 0\n`);
});
