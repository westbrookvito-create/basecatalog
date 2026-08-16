import { Router } from 'express';
import { getProductById } from '../models/products.js';
import { createOrder, getOrderById } from '../models/orders.js';
import { isValidDeliveryMethod } from '../config/delivery.js';
import { pickRandomRequisites } from '../config/payments.js';
import { verifyInitData } from '../utils/telegramAuth.js';
import { notifyAdminsNewOrder } from '../bot/bot.js';

export const ordersRouter = Router();

function resolveTelegramUser(req) {
  const verified = verifyInitData(req.body.initData, process.env.BOT_TOKEN);
  if (verified) return verified;

  // Dev-only escape hatch for testing outside of Telegram. Never active
  // unless explicitly opted into via env var, and never trusts client input
  // in a real deployment.
  if (process.env.ALLOW_DEBUG_AUTH === 'true' && req.body.debugUser) {
    return req.body.debugUser;
  }
  return null;
}

ordersRouter.post('/', async (req, res) => {
  const tgUser = resolveTelegramUser(req);
  if (!tgUser?.id) {
    return res.status(401).json({ error: 'invalid_telegram_auth' });
  }

  const { productId, size, deliveryMethod, recipientName, phone, address } = req.body;
  const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
  const quantity = Number.isInteger(req.body.quantity) ? req.body.quantity : 1;

  const product = getProductById(Number(productId));
  if (!product || !product.active) {
    return res.status(400).json({ error: 'product_not_found' });
  }

  if (quantity < 1 || quantity > 20) {
    return res.status(400).json({ error: 'invalid_quantity' });
  }

  let normalizedSize = null;
  if (product.sizes.length > 0) {
    if (!size || !product.sizes.includes(size)) {
      return res.status(400).json({ error: 'invalid_size' });
    }
    normalizedSize = size;
  }

  if (!deliveryMethod || !isValidDeliveryMethod(deliveryMethod)) {
    return res.status(400).json({ error: 'invalid_delivery_method' });
  }

  if (typeof recipientName !== 'string' || recipientName.trim().length < 2) {
    return res.status(400).json({ error: 'recipient_name_required' });
  }

  const phoneDigits = typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
  if (phoneDigits.length < 10) {
    return res.status(400).json({ error: 'invalid_phone' });
  }

  if (typeof address !== 'string' || address.trim().length < 5) {
    return res.status(400).json({ error: 'address_required' });
  }

  const paymentRequisites = pickRandomRequisites();
  const totalPrice = product.price * quantity;

  const order = createOrder({
    telegramUserId: tgUser.id,
    username: tgUser.username || null,
    fullName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || null,
    productId: product.id,
    productTitle: product.title,
    productPrice: product.price,
    size: normalizedSize,
    quantity,
    totalPrice,
    deliveryMethod,
    recipientName: recipientName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    comment,
    paymentRequisites,
  });

  // Synchronous, in the same request, before responding to the frontend —
  // the admin must see the order immediately with full details + payment
  // requisites + inline confirm/cancel buttons.
  await notifyAdminsNewOrder(order);

  res.status(201).json(order);
});

ordersRouter.get('/:id', (req, res) => {
  const tgUser = verifyInitData(req.query.initData, process.env.BOT_TOKEN);
  const order = getOrderById(Number(req.params.id));

  if (!order) {
    return res.status(404).json({ error: 'order_not_found' });
  }

  const debugAllowed = process.env.ALLOW_DEBUG_AUTH === 'true';
  if (!debugAllowed && (!tgUser || tgUser.id !== order.telegram_user_id)) {
    return res.status(403).json({ error: 'forbidden' });
  }

  res.json(order);
});
