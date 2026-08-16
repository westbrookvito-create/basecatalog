import { Telegraf, Markup } from 'telegraf';
import { formatOrderCard, buildOrderKeyboard } from './adminCard.js';
import { applyOrderAction, listOrders, setAdminMessageRef } from '../models/orders.js';
import { createProduct, listCategories } from '../models/products.js';
import { monogramPlaceholder } from '../utils/placeholderImage.js';
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

// ---- Admin: add product wizard ----
// Simple in-memory step machine per admin (keyed by Telegram user id) —
// not persisted, so restarting mid-wizard just means running /add_product
// again. Categories aren't a separate concept: picking "+ Новая категория"
// and typing a name is how a new category gets added.

const addProductSessions = new Map();

function categoryKeyboard(categories) {
  const rows = categories.map((c, i) => [Markup.button.callback(c, `addprod:cat:${i}`)]);
  rows.push([Markup.button.callback('+ Новая категория', 'addprod:cat:new')]);
  return Markup.inlineKeyboard(rows);
}

bot.command('add_product', requireAdmin, (ctx) => {
  addProductSessions.set(ctx.from.id, { step: 'title', data: {} });
  ctx.reply('Добавление товара.\n\nНазвание товара:');
});

bot.command('cancel', requireAdmin, (ctx) => {
  if (addProductSessions.delete(ctx.from.id)) {
    ctx.reply('Добавление товара отменено.');
  } else {
    ctx.reply('Сейчас нечего отменять.');
  }
});

bot.action(/^addprod:cat:(new|\d+)$/, requireAdmin, async (ctx) => {
  const session = addProductSessions.get(ctx.from.id);
  if (!session || session.step !== 'category') {
    await ctx.answerCbQuery('Сессия добавления товара не найдена, начните заново: /add_product', {
      show_alert: true,
    });
    return;
  }

  const choice = ctx.match[1];
  await ctx.answerCbQuery();

  if (choice === 'new') {
    session.step = 'category_new';
    await ctx.editMessageText('Введите название новой категории:');
    return;
  }

  const category = session._categories[Number(choice)];
  session.data.category = category;
  session.step = 'sizes';
  await ctx.editMessageText(
    `Категория: ${category}\n\nРазмеры через запятую (например: S, M, L), либо «-», если размеров нет:`
  );
});

async function finishAddProduct(ctx, session) {
  const { data } = session;
  const product = createProduct({
    title: data.title,
    description: data.description || '',
    price: data.price,
    images: [data.image],
    sizes: data.sizes,
    category: data.category,
  });
  addProductSessions.delete(ctx.from.id);

  await ctx.reply(
    [
      '✅ Товар добавлен в каталог.',
      '',
      `#${product.id} ${product.title}`,
      `Цена: ${product.price} ₽`,
      `Категория: ${product.category}`,
      product.sizes.length ? `Размеры: ${product.sizes.join(', ')}` : 'Без размеров',
    ].join('\n')
  );
}

bot.on('photo', async (ctx) => {
  const session = addProductSessions.get(ctx.from.id);
  if (!session || session.step !== 'photo' || !isAdmin(ctx)) return;

  try {
    const photos = ctx.message.photo;
    const fileId = photos[photos.length - 1].file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    session.data.image = `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error('Failed to download product photo:', err.message);
    await ctx.reply(
      'Не удалось загрузить фото, попробуйте ещё раз или отправьте «-», чтобы пропустить.'
    );
    return;
  }

  await finishAddProduct(ctx, session);
});

// Registered last so specific commands/actions above always get first crack
// at a message — this only ever sees text that didn't match any of them.
bot.on('text', async (ctx, next) => {
  const session = addProductSessions.get(ctx.from.id);
  if (!session || !isAdmin(ctx)) return next();

  const text = ctx.message.text.trim();

  switch (session.step) {
    case 'title': {
      if (!text) {
        await ctx.reply('Название не может быть пустым. Попробуйте снова:');
        return;
      }
      session.data.title = text;
      session.step = 'description';
      await ctx.reply('Описание товара (или «-», чтобы пропустить):');
      return;
    }
    case 'description': {
      session.data.description = text === '-' ? '' : text;
      session.step = 'price';
      await ctx.reply('Цена в ₽ (только число):');
      return;
    }
    case 'price': {
      const price = Number(text.replace(',', '.').replace(/\s/g, ''));
      if (!Number.isFinite(price) || price <= 0) {
        await ctx.reply('Введите цену числом, например 12000:');
        return;
      }
      session.data.price = Math.round(price);
      session.step = 'category';
      session._categories = listCategories();
      await ctx.reply('Выберите категорию:', categoryKeyboard(session._categories));
      return;
    }
    case 'category_new': {
      if (!text) {
        await ctx.reply('Название категории не может быть пустым. Попробуйте снова:');
        return;
      }
      session.data.category = text;
      session.step = 'sizes';
      await ctx.reply(
        `Категория: ${text}\n\nРазмеры через запятую (например: S, M, L), либо «-», если размеров нет:`
      );
      return;
    }
    case 'sizes': {
      session.data.sizes =
        text === '-' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean);
      session.step = 'photo';
      await ctx.reply('Отправьте фото товара, либо «-», чтобы использовать заглушку:');
      return;
    }
    case 'photo': {
      if (text === '-') {
        session.data.image = monogramPlaceholder(session.data.title[0].toUpperCase());
        await finishAddProduct(ctx, session);
        return;
      }
      await ctx.reply('Отправьте фото товара как изображение, либо «-», чтобы пропустить.');
      return;
    }
    default:
      return next();
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
