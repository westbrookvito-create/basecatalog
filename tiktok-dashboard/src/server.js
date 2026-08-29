import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import cron from 'node-cron';
import { fileURLToPath } from 'node:url';
import { accountsRouter } from './routes/accounts.js';
import { runDispatchCycle } from './dispatch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Дашборд показывает ваши ссылки и переписку с чужим ботом — закрываем
// Basic Auth, если заданы DASHBOARD_USER/DASHBOARD_PASSWORD.
app.use((req, res, next) => {
  const user = process.env.DASHBOARD_USER;
  const password = process.env.DASHBOARD_PASSWORD;
  if (!user || !password) return next();

  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [reqUser, reqPassword] = Buffer.from(encoded, 'base64').toString().split(':');
    if (
      reqUser &&
      reqPassword &&
      timingSafeEqual(reqUser, user) &&
      timingSafeEqual(reqPassword, password)
    ) {
      return next();
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="tiktok-dashboard"');
  res.status(401).send('Authentication required');
});

app.use('/api', accountsRouter);

app.post('/api/run-now', async (req, res) => {
  const result = await runDispatchCycle();
  res.json(result);
});

app.use(express.static(path.join(__dirname, '..', 'public')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`[server] дашборд слушает на порту ${port}`);
});

const cronExpression = process.env.SCHEDULE_CRON || '0 * * * *';
if (!cron.validate(cronExpression)) {
  console.error(`[server] некорректное SCHEDULE_CRON: "${cronExpression}", планировщик не запущен`);
} else {
  console.log(`[server] расписание рассылки: "${cronExpression}"`);
  cron.schedule(cronExpression, () => {
    runDispatchCycle().catch((err) => console.error('[dispatch] непойманная ошибка цикла:', err));
  });
}
