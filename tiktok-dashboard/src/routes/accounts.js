import { Router } from 'express';
import db from '../db.js';

export const accountsRouter = Router();

const latestRunStmt = db.prepare(`
  SELECT * FROM runs WHERE account_id = ? ORDER BY id DESC LIMIT 1
`);

const runsStmt = db.prepare(`
  SELECT * FROM runs WHERE account_id = ? ORDER BY id DESC LIMIT ?
`);

function serializeAccount(account) {
  return { ...account, active: !!account.active, latest_run: latestRunStmt.get(account.id) || null };
}

accountsRouter.get('/accounts', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts ORDER BY id').all();
  res.json(accounts.map(serializeAccount));
});

accountsRouter.post('/accounts', (req, res) => {
  const { tiktok_url, label } = req.body || {};
  if (!tiktok_url || typeof tiktok_url !== 'string' || !tiktok_url.trim()) {
    return res.status(400).json({ error: 'tiktok_url обязателен' });
  }
  const info = db
    .prepare('INSERT INTO accounts (tiktok_url, label) VALUES (?, ?)')
    .run(tiktok_url.trim(), (label || '').trim());
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(serializeAccount(account));
});

accountsRouter.patch('/accounts/:id', (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'не найден' });

  const { tiktok_url, label, active } = req.body || {};
  db.prepare(
    `UPDATE accounts SET
       tiktok_url = COALESCE(?, tiktok_url),
       label = COALESCE(?, label),
       active = COALESCE(?, active)
     WHERE id = ?`
  ).run(
    tiktok_url ?? null,
    label ?? null,
    active === undefined ? null : active ? 1 : 0,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  res.json(serializeAccount(updated));
});

accountsRouter.delete('/accounts/:id', (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

accountsRouter.get('/accounts/:id/runs', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json(runsStmt.all(req.params.id, limit));
});
