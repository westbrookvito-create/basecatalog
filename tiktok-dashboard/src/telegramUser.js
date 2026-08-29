import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions/index.js';
import { NewMessage } from 'teleproto/events/index.js';

let clientPromise = null;
let targetEntity = null;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Отсутствует переменная окружения ${name} (см. .env.example)`);
  return value;
}

async function createClient() {
  const apiId = Number(requireEnv('TG_API_ID'));
  const apiHash = requireEnv('TG_API_HASH');
  const sessionString = requireEnv('TG_SESSION');

  const client = new TelegramClient(new StringSession(sessionString), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const me = await client.getMe();
  if (!me) {
    throw new Error('Не удалось авторизоваться — сессия недействительна. Перезапустите `npm run login`.');
  }

  return client;
}

// Один переиспользуемый MTProto-клиент личного аккаунта на весь процесс.
export async function getClient() {
  if (!clientPromise) clientPromise = createClient();
  return clientPromise;
}

async function getTargetEntity(client) {
  if (targetEntity) return targetEntity;
  const username = requireEnv('TARGET_BOT_USERNAME').replace(/^@/, '');
  targetEntity = await client.getEntity(username);
  return targetEntity;
}

/**
 * Отправляет текст целевому боту от лица личного аккаунта и ждёт его
 * следующий ответ. Вызовы должны идти последовательно (не параллельно),
 * иначе ответ на одну ссылку может быть ошибочно засчитан за другую.
 */
export async function sendAndAwaitReply(text, timeoutSeconds) {
  const client = await getClient();
  const bot = await getTargetEntity(client);

  const replyPromise = new Promise((resolve) => {
    let settled = false;
    const handler = (event) => {
      const message = event.message;
      if (!message || message.out) return;
      const senderId = message.senderId ?? message.peerId;
      if (!senderId || String(senderId) !== String(bot.id)) return;
      if (settled) return;
      settled = true;
      client.removeEventHandler(handler, new NewMessage({}));
      resolve({ status: 'ok', text: message.message ?? '' });
    };

    client.addEventHandler(handler, new NewMessage({}));

    setTimeout(() => {
      if (settled) return;
      settled = true;
      client.removeEventHandler(handler, new NewMessage({}));
      resolve({ status: 'timeout', text: null });
    }, timeoutSeconds * 1000);
  });

  await client.sendMessage(bot, { message: text });
  return replyPromise;
}
