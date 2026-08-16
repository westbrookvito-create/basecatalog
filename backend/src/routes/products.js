import { Router } from 'express';
import { listProducts, getProductById } from '../models/products.js';

export const productsRouter = Router();

productsRouter.get('/', (req, res) => {
  const { category } = req.query;
  res.json(listProducts({ category }));
});

productsRouter.get('/:id', (req, res) => {
  const product = getProductById(Number(req.params.id));
  if (!product) {
    return res.status(404).json({ error: 'product_not_found' });
  }
  res.json(product);
});
