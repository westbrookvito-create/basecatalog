import { Router } from 'express';
import { DELIVERY_METHODS } from '../config/delivery.js';

export const configRouter = Router();

configRouter.get('/', (req, res) => {
  res.json({ deliveryMethods: DELIVERY_METHODS });
});
