// Разовый интерактивный скрипт для авторизации личного Telegram-аккаунта.
// Запускать локально на своей машине (не на Railway): `npm run login`.
// В конце печатает TG_SESSION — вставьте это значение в .env / переменные
// окружения сервиса. Значение даёт полный доступ к аккаунту, никому его
// не передавайте и не коммитьте в git.
import 'dotenv/config';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { TelegramClient } from 'teleproto';
import { StringSession } from 'teleproto/sessions/index.js';

const rl = readline.createInterface({ input: stdin, output: stdout });
const ask = (question) => rl.question(question);

async function main() {
  const apiId = Number(process.env.TG_API_ID || (await ask('TG_API_ID (с my.telegram.org/apps): ')));
  const apiHash = process.env.TG_API_HASH || (await ask('TG_API_HASH: '));

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: () => ask('Номер телефона (в международном формате, напр. +79991234567): '),
    password: () => ask('Пароль двухфакторной аутентификации (если включена, иначе Enter): '),
    phoneCode: () => ask('Код из Telegram: '),
    onError: (err) => console.error(err),
  });

  console.log('\nАвторизация успешна. Добавьте эту строку в .env как TG_SESSION:\n');
  console.log(client.session.save());
  console.log('\nНе публикуйте её и не коммитьте в git — она даёт полный доступ к аккаунту.\n');

  await client.disconnect();
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
