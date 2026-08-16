import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dbPath = process.env.DB_PATH || './data/wanchenko.db';
const resolvedPath = path.resolve(process.cwd(), dbPath);
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

export const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price INTEGER NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    sizes TEXT NOT NULL DEFAULT '[]',
    category TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_user_id INTEGER NOT NULL,
    username TEXT,
    full_name TEXT,
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_title TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    size TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price INTEGER NOT NULL,
    delivery_method TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    comment TEXT NOT NULL DEFAULT '',
    payment_requisites TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_chat_id INTEGER,
    admin_message_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT,
    shipped_at TEXT,
    received_at TEXT,
    cancelled_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);
  CREATE INDEX IF NOT EXISTS idx_orders_telegram_user_id ON orders(telegram_user_id);
`);

export default db;
