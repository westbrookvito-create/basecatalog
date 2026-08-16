import { Telegraf, Markup } from 'telegraf';
import { formatOrderCard, buildOrderKeyboard } from './adminCard.js';
import { applyOrderAction, listOrders, setAdminMessageRef } from '../models/orders.js';
import { BUYER_NOTIFICATIONS, STATUS_ORDER, statusLabel } from '../config/statuses.js';
import { DELIVERY_METHODS } from '../config/delivery.js';

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN is not set');
}

export const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);

export const bot = new Telegraf(BOT_TOKEN);

function isAdmin(ctx) {
  return ADMIN_IDS.includes(ctx.from?.id);
}

async function requireAdmin(ctx, next) {
  if (!isAdmin(ctx)) {
    await ctx.reply('Эта команда доступна только администратору.');
    return;
  }
  return next();
}

bot.start((ctx) => {
  const miniAppUrl = process.env.MINIAPP_URL;
  const text = [
    '🖤 wanchenko',
    '',
    'Добро пожаловать. Откройте каталог, чтобы посмотреть текущие вещи.',
  ].join('\n');

  if (miniAppUrl) {
    return ctx.reply(
      text,
      Markup.inlineKeyboard([Markup.button.webApp('Открыть каталог', miniAppUrl)])
    );
  }
  return ctx.reply(text);
});

// ---- Admin: full order history browser ----
// Two-step filter menu: status, then delivery method — both driven by the
// same generic listOrders({status, deliveryMethod}) query.

bot.command('orders', requireAdmin, async (ctx) => {
  await sendStatusFilterMenu(ctx);
});

async function sendStatusFilterMenu(ctx, edit = false) {
  const buttons = [
    [Markup.button.callback('Все статусы', 'filt:status:all')],
    ...STATUS_ORDER.map((s) => [Markup.button.callback(statusLabel(s), `filt:status:${s}`)]),
  ];
  const text = 'Выберите статус заказов:';
  if (edit) {
    await ctx.editMessageText(text, Markup.inlineKeyboard(buttons));
  } else {
    await ctx.reply(text, Markup.inlineKeyboard(buttons));
  }
}

bot.action(/^filt:status:(all|[a-z_]+)$/, requireAdmin, async (ctx) => {
  const status = ctx.match[1];
  const buttons = [
    [Markup.button.callback('Любой способ', `filt:delivery:all:${status}`)],
    ...DELIVERY_METHODS.map((m) => [
      Markup.button.callback(m.label, `filt:delivery:${m.id}:${status}`),
    ]),
  ];
  await ctx.editMessageText('Выберите способ доставки:', Markup.inlineKeyboard(buttons));
  await ctx.answerCbQuery();
});

bot.action(/^filt:delivery:([a-z_]+):(all|[a-z_]+)$/, requireAdmin, async (ctx) => {
  const [, deliveryMethod, status] = ctx.match;
  const orders = listOrders({
    status: status === 'all' ? undefined : status,
    deliveryMethod: deliveryMethod === 'all' ? undefined : deliveryMethod,
  });

  if (orders.length === 0) {
    await ctx.editMessageText('Заказов по выбранным фильтрам не найдено.');
    await ctx.answerCbQuery();
    return;
  }

  await ctx.editMessageText(`Найдено заказов: ${orders.length}`);
  await ctx.answerCbQuery();

  for (const order of orders) {
    await ctx.reply(formatOrderCard(order), buildOrderKeyboard(order));
  }
});

// ---- Admin: order status actions (confirm/cancel/ship/receive) ----

bot.action(/^act:([a-z_]+):(\d+)$/, requireAdmin, async (ctx) => {
  const [, actionId, orderIdStr] = ctx.match;
  const orderId = Number(orderIdStr);

  const result = applyOrderAction(orderId, actionId);

  if (!result.ok) {
    if (result.reason === 'already_processed') {
      // Refresh the message so it reflects reality, then tell the admin.
      await ctx.editMessageText(formatOrderCard(result.order), buildOrderKeyboard(result.order));
      await ctx.answerCbQuery('Заказ уже обработан', { show_alert: true });
      return;
    }
    await ctx.answerCbQuery('Не удалось выполнить действие', { show_alert: true });
    return;
  }

  const { order } = result;
  await ctx.editMessageText(formatOrderCard(order), buildOrderKeyboard(order));
  await ctx.answerCbQuery('Готово');

  const notify = BUYER_NOTIFICATIONS[order.status];
  if (notify) {
    try {
      await bot.telegram.sendMessage(order.telegram_user_id, notify(order));
    } catch (err) {
      console.error(`Failed to notify buyer for order #${order.id}:`, err.message);
    }
  }
});

export async function notifyAdminsNewOrder(order) {
  const text = formatOrderCard(order);
  const keyboard = buildOrderKeyboard(order);

  let firstMessage = null;
  for (const adminId of ADMIN_IDS) {
    try {
      const message = await bot.telegram.sendMessage(adminId, text, keyboard);
      if (!firstMessage) firstMessage = message;
    } catch (err) {
      console.error(`Failed to notify admin ${adminId}:`, err.message);
    }
  }
  if (firstMessage) {
    setAdminMessageRef(order.id, firstMessage.chat.id, firstMessage.message_id);
  }
}
