import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import './db.js'; // ensures schema is created before anything else runs
import { bot } from './bot/bot.js';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { configRouter } from './routes/config.js';

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }));
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/config', configRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

bot.launch().then(
  () => console.log('Bot started (long polling)'),
  (err) => {
    console.error('Failed to start bot:', err.message);
    process.exit(1);
  }
);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
