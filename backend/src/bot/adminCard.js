import { Markup } from 'telegraf';
import { statusLabel, getActionsForStatus } from '../config/statuses.js';
import { deliveryLabel } from '../config/delivery.js';

// Single source of truth for rendering an order as an admin chat message.
// Used both for the initial "new order" notification and for the /orders
// history browser — so the two never drift apart.
export function formatOrderCard(order) {
  const lines = [
    `📦 Заказ #${order.id} — ${statusLabel(order.status)}`,
    '',
    `Товар: ${order.product_title}${order.size ? ` (${order.size})` : ''} × ${order.quantity}`,
    `Сумма: ${order.total_price} ₽`,
    '',
    `Покупатель: ${order.full_name || '—'} (@${order.username || 'без username'})`,
    `Telegram ID: ${order.telegram_user_id}`,
    '',
    `Способ доставки: ${deliveryLabel(order.delivery_method)}`,
    `Получатель: ${order.recipient_name}`,
    `Телефон: ${order.phone}`,
    `Адрес: ${order.address}`,
  ];

  if (order.comment) {
    lines.push(`Комментарий: ${order.comment}`);
  }

  lines.push(
    '',
    'Реквизиты, показанные клиенту:',
    `${order.payment_requisites.bank}, ${order.payment_requisites.number}`,
    `Получатель платежа: ${order.payment_requisites.holder}`,
    '',
    `Создан: ${order.created_at}`
  );

  if (order.paid_at) lines.push(`Оплачен: ${order.paid_at}`);
  if (order.shipped_at) lines.push(`Отправлен: ${order.shipped_at}`);
  if (order.received_at) lines.push(`Получен: ${order.received_at}`);
  if (order.cancelled_at) lines.push(`Отменён: ${order.cancelled_at}`);

  return lines.join('\n');
}

export function buildOrderKeyboard(order) {
  const actions = getActionsForStatus(order.status);
  const row = actions.map((a) => Markup.button.callback(a.label, `act:${a.id}:${order.id}`));
  return Markup.inlineKeyboard(row.length ? [row] : []);
}
