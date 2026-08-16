import 'dotenv/config';
import { db } from './db.js';
import { createProduct } from './models/products.js';

const products = [
  {
    title: 'Шерстяное пальто оверсайз',
    description: 'Классическое пальто прямого кроя из смесовой шерсти. Состояние: как новое.',
    price: 18900,
    images: ['https://picsum.photos/seed/wanchenko-coat/900/1200'],
    sizes: ['XS', 'S', 'M', 'L'],
    category: 'Верхняя одежда',
  },
  {
    title: 'Кожаная сумка-тоут',
    description: 'Сумка из натуральной кожи, ручная работа. Оригинал.',
    price: 24500,
    images: ['https://picsum.photos/seed/wanchenko-bag/900/1200'],
    sizes: [],
    category: 'Аксессуары',
  },
  {
    title: 'Кроссовки минималистичные',
    description: 'Белые кожаные кроссовки на низкой подошве.',
    price: 9200,
    images: ['https://picsum.photos/seed/wanchenko-sneakers/900/1200'],
    sizes: ['38', '39', '40', '41', '42', '43'],
    category: 'Обувь',
  },
  {
    title: 'Костюм из твида',
    description: 'Жакет и брюки из плотного твида, комплект.',
    price: 32000,
    images: ['https://picsum.photos/seed/wanchenko-suit/900/1200'],
    sizes: ['S', 'M', 'L'],
    category: 'Костюмы',
  },
  {
    title: 'Шёлковый платок',
    description: '100% шёлк, ручная закатка края.',
    price: 4200,
    images: ['https://picsum.photos/seed/wanchenko-scarf/900/1200'],
    sizes: [],
    category: 'Аксессуары',
  },
  {
    title: 'Джинсы прямого кроя',
    description: 'Плотный деним, прямой силуэт, средняя посадка.',
    price: 7300,
    images: ['https://picsum.photos/seed/wanchenko-jeans/900/1200'],
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
