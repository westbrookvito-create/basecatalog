// Разовый ручной прогон рассылки из командной строки: `npm run run-now`.
import 'dotenv/config';
import { runDispatchCycle } from './dispatch.js';

runDispatchCycle()
  .then((result) => {
    console.log('Готово:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
