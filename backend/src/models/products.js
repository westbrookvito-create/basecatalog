import { db } from '../db.js';

function parseProduct(row) {
  if (!row) return null;
  return {
    ...row,
    images: JSON.parse(row.images),
    sizes: JSON.parse(row.sizes),
    active: !!row.active,
  };
}

export function listProducts({ category } = {}) {
  let query = 'SELECT * FROM products WHERE active = 1';
  const params = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(parseProduct);
}

export function getProductById(id) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return parseProduct(row);
}

export function createProduct({ title, description = '', price, images = [], sizes = [], category = '' }) {
  const result = db
    .prepare(
      `INSERT INTO products (title, description, price, images, sizes, category)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(title, description, price, JSON.stringify(images), JSON.stringify(sizes), category);
  return getProductById(result.lastInsertRowid);
}
