import { db } from '../db.js';
import { ORDER_ACTIONS, ORDER_STATUSES } from '../config/statuses.js';

function parseOrder(row) {
  if (!row) return null;
  return {
    ...row,
    payment_requisites: JSON.parse(row.payment_requisites),
  };
}

export function createOrder({
  telegramUserId,
  username,
  fullName,
  productId,
  productTitle,
  productPrice,
  size,
  quantity,
  totalPrice,
  deliveryMethod,
  recipientName,
  phone,
  address,
  comment,
  paymentRequisites,
}) {
  const result = db
    .prepare(
      `INSERT INTO orders (
        telegram_user_id, username, full_name,
        product_id, product_title, product_price, size, quantity, total_price,
        delivery_method, recipient_name, phone, address, comment,
        payment_requisites, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(
      telegramUserId,
      username,
      fullName,
      productId,
      productTitle,
      productPrice,
      size,
      quantity,
      totalPrice,
      deliveryMethod,
      recipientName,
      phone,
      address,
      comment,
      JSON.stringify(paymentRequisites)
    );
  return getOrderById(result.lastInsertRowid);
}

export function getOrderById(id) {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return parseOrder(row);
}

// Universal listing method with optional filters — avoids one bespoke query
// per filter combination.
export function listOrders({ status, deliveryMethod } = {}) {
  let query = 'SELECT * FROM orders WHERE 1 = 1';
  const params = [];
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (deliveryMethod) {
    query += ' AND delivery_method = ?';
    params.push(deliveryMethod);
  }
  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  return rows.map(parseOrder);
}

export function setAdminMessageRef(orderId, chatId, messageId) {
  db.prepare('UPDATE orders SET admin_chat_id = ?, admin_message_id = ? WHERE id = ?').run(
    chatId,
    messageId,
    orderId
  );
}

// Applies `actionId` (see ORDER_ACTIONS) to the order, guarding against
// stale/duplicate clicks: the action only applies if the order is still in
// the expected `from` status. Stamps the date column configured for the
// resulting status, per ORDER_STATUSES — no per-status branching elsewhere.
export function applyOrderAction(orderId, actionId) {
  const action = ORDER_ACTIONS[actionId];
  if (!action) return { ok: false, reason: 'unknown_action' };

  const order = getOrderById(orderId);
  if (!order) return { ok: false, reason: 'not_found' };

  if (order.status !== action.from) {
    return { ok: false, reason: 'already_processed', order };
  }

  const dateColumn = ORDER_STATUSES[action.to]?.dateColumn;
  const sets = ['status = ?'];
  const params = [action.to];
  if (dateColumn) {
    sets.push(`${dateColumn} = datetime('now')`);
  }
  params.push(orderId);

  db.prepare(`UPDATE orders SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  return { ok: true, order: getOrderById(orderId) };
}
