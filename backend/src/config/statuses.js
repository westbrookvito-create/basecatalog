import { deliveryLabel } from './delivery.js';

// Single source of truth for the order state machine.
// Each status knows which DB column to stamp with the current date when the
// order enters it (null = no column, e.g. pending is stamped by created_at
// at insert time already).
export const ORDER_STATUSES = {
  pending: { label: 'Ожидает оплаты', dateColumn: null },
  paid: { label: 'Оплачен', dateColumn: 'paid_at' },
  shipped: { label: 'Отправлен', dateColumn: 'shipped_at' },
  received: { label: 'Получен', dateColumn: 'received_at' },
  cancelled: { label: 'Отменён', dateColumn: 'cancelled_at' },
};

export const STATUS_ORDER = ['pending', 'paid', 'shipped', 'received', 'cancelled'];

// Every possible admin action, the status it's valid FROM, and the status it
// leads TO. Inline keyboards are built purely from this table, keyed by the
// order's current status — no per-status special-casing scattered around.
export const ORDER_ACTIONS = {
  confirm_payment: { from: 'pending', to: 'paid', label: '✅ Подтвердить оплату' },
  cancel: { from: 'pending', to: 'cancelled', label: '❌ Отменить' },
  ship: { from: 'paid', to: 'shipped', label: '📦 Отправлено' },
  receive: { from: 'shipped', to: 'received', label: '📬 Получено' },
};

export function getActionsForStatus(status) {
  return Object.entries(ORDER_ACTIONS)
    .filter(([, action]) => action.from === status)
    .map(([id, action]) => ({ id, label: action.label, to: action.to }));
}

export function statusLabel(status) {
  return ORDER_STATUSES[status]?.label || status;
}

// Message sent to the buyer in DM after each status transition.
// pending -> paid transition text intentionally skipped from here for
// "cancel", handled separately since it needs no congratulatory tone.
export const BUYER_NOTIFICATIONS = {
  paid: (order) => `Ваш заказ #${order.id} оплачен ✅. Мы начинаем его обработку.`,
  shipped: (order) =>
    `Ваш заказ #${order.id} отправлен 📦 (${deliveryLabel(order.delivery_method)}). Отслеживайте доставку по указанному адресу.`,
  received: (order) => `Заказ #${order.id} отмечен как полученный. Спасибо за покупку! 🤍`,
  cancelled: (order) => `Ваш заказ #${order.id} отменён.`,
};
