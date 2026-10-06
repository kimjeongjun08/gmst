// 3과제 체험 API — 관계형 데이터 계층 (내장 node:sqlite, 의존성 0)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const HERE = import.meta.dirname;
const DB_PATH = resolve(HERE, process.env.DB_PATH ?? 'data/gmst.db');
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec(readFileSync(resolve(HERE, 'schema.sql'), 'utf8'));

// --- 최초 1회 시드 ---
const seeded = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
if (!seeded) {
  const u = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  const ids = ['김클라우드 kim@gmst.kr', '이서버 lee@gmst.kr', '박데브옵스 park@gmst.kr']
    .map((s) => { const [name, email] = s.split(' '); return u.run(name, email).lastInsertRowid; });
  const p = db.prepare('INSERT INTO products (name, price, owner_id) VALUES (?, ?, ?)');
  p.run('오브젝트 스토리지 100GB', 3000, ids[0]);
  p.run('관리형 데이터베이스', 12000, ids[1]);
  p.run('로드밸런서 1대', 8000, ids[2]);
}

const stmt = {
  users:   db.prepare('SELECT id, name, email, created_at FROM users ORDER BY id'),
  user:    db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?'),
  addUser: db.prepare('INSERT INTO users (name, email) VALUES (:name, :email)'),
  // product + owner 이름을 JOIN으로 함께 반환 → 관계형 DB임을 체감
  products: db.prepare(`
    SELECT p.id, p.name, p.price, p.owner_id, u.name AS owner_name, p.created_at
    FROM products p LEFT JOIN users u ON u.id = p.owner_id ORDER BY p.id`),
  addProduct: db.prepare('INSERT INTO products (name, price, owner_id) VALUES (:name, :price, :owner_id)'),
  count:   db.prepare('SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM products) AS products'),
};

export const DB = {
  users: () => stmt.users.all(),
  user: (id) => stmt.user.get(id),
  addUser: (name, email) => stmt.addUser.run({ name, email }).lastInsertRowid,
  products: () => stmt.products.all(),
  addProduct: (name, price, owner_id) => stmt.addProduct.run({ name, price, owner_id }).lastInsertRowid,
  count: () => stmt.count.get(),
  // /v1/stress 가 돌릴 가벼운 쿼리 (부하 테스트 시뮬레이션)
  ping: db.prepare('SELECT COUNT(*) AS n FROM products'),
};

export default DB;
