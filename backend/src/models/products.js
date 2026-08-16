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

// Categories aren't a separate table — they're just the distinct values
// already in use on products. Typing a new one while adding a product is
// how a category gets "added".
export function listCategories() {
  const rows = db
    .prepare("SELECT DISTINCT category FROM products WHERE category != '' ORDER BY category")
    .all();
  return rows.map((r) => r.category);
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
