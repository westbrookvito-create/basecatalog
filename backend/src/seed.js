import 'dotenv/config';
import { db } from './db.js';
import { createProduct } from './models/products.js';

// Neutral-tone SVG placeholder with a thin monogram — used until real product
// photos are uploaded, and avoids depending on an external image host.
function placeholder(bg, letter) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='1200'>
    <rect width='100%' height='100%' fill='${bg}'/>
    <text x='50%' y='53%' font-family='Georgia, serif' font-size='120' fill='#00000022'
      text-anchor='middle' dominant-baseline='middle'>${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const products = [
  {
    title: 'Шерстяное пальто оверсайз',
    description: 'Классическое пальто прямого кроя из смесовой шерсти. Состояние: как новое.',
    price: 18900,
    images: [placeholder('#e7e2da', 'П')],
    sizes: ['XS', 'S', 'M', 'L'],
    category: 'Верхняя одежда',
  },
  {
    title: 'Кожаная сумка-тоут',
    description: 'Сумка из натуральной кожи, ручная работа. Оригинал.',
    price: 24500,
    images: [placeholder('#ded6c8', 'С')],
    sizes: [],
    category: 'Аксессуары',
  },
  {
    title: 'Кроссовки минималистичные',
    description: 'Белые кожаные кроссовки на низкой подошве.',
    price: 9200,
    images: [placeholder('#e3e3e0', 'К')],
    sizes: ['38', '39', '40', '41', '42', '43'],
    category: 'Обувь',
  },
  {
    title: 'Костюм из твида',
    description: 'Жакет и брюки из плотного твида, комплект.',
    price: 32000,
    images: [placeholder('#d9d2c6', 'К')],
    sizes: ['S', 'M', 'L'],
    category: 'Костюмы',
  },
  {
    title: 'Шёлковый платок',
    description: '100% шёлк, ручная закатка края.',
    price: 4200,
    images: [placeholder('#e6ddd1', 'Ш')],
    sizes: [],
    category: 'Аксессуары',
  },
  {
    title: 'Джинсы прямого кроя',
    description: 'Плотный деним, прямой силуэт, средняя посадка.',
    price: 7300,
    images: [placeholder('#dfe0e2', 'Д')],
    sizes: ['26', '27', '28', '29', '30', '31'],
    category: 'Одежда',
  },
];

const existing = db.prepare('SELECT COUNT(*) AS count FROM products').get();
if (existing.count > 0) {
  console.log(`Products table already has ${existing.count} rows — skipping seed.`);
  process.exit(0);
}

for (const p of products) {
  createProduct(p);
}

console.log(`Seeded ${products.length} products.`);
