import db from './db.js';
import { sendAndAwaitReply } from './telegramUser.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let running = false;

/**
 * Последовательно отправляет ссылку каждого активного аккаунта целевому
 * боту, дожидается ответа (или таймаута) прежде чем переходить к
 * следующему — это нужно, чтобы верно сопоставлять ответ бота с аккаунтом,
 * по которому он получен.
 */
export async function runDispatchCycle() {
  if (running) {
    console.log('[dispatch] предыдущий цикл ещё выполняется, пропускаю запуск');
    return { skipped: true };
  }
  running = true;

  const timeoutSeconds = Number(process.env.REPLY_TIMEOUT_SECONDS || 25);
  const delaySeconds = Number(process.env.DELAY_BETWEEN_SENDS_SECONDS || 5);

  try {
    const accounts = db.prepare('SELECT * FROM accounts WHERE active = 1 ORDER BY id').all();
    console.log(`[dispatch] старт цикла, аккаунтов: ${accounts.length}`);

    const insertRun = db.prepare(
      `INSERT INTO runs (account_id, status) VALUES (?, 'pending')`
    );
    const updateRun = db.prepare(
      `UPDATE runs SET status = ?, response_text = ?, responded_at = datetime('now') WHERE id = ?`
    );

    for (const account of accounts) {
      const runId = insertRun.run(account.id).lastInsertRowid;
      try {
        const result = await sendAndAwaitReply(account.tiktok_url, timeoutSeconds);
        updateRun.run(result.status, result.text, runId);
        console.log(`[dispatch] аккаунт #${account.id} (${account.label || account.tiktok_url}) -> ${result.status}`);
      } catch (err) {
        updateRun.run('error', String(err?.message || err), runId);
        console.error(`[dispatch] ошибка на аккаунте #${account.id}:`, err);
      }
      await sleep(delaySeconds * 1000);
    }

    console.log('[dispatch] цикл завершён');
    return { skipped: false, count: accounts.length };
  } finally {
    running = false;
  }
}
