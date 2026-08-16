# wanchenko — Telegram Mini App + бот заказов

Каталог в стиле Farfetch с оформлением заказов через ручную оплату переводом.
Бот (Telegraf) и REST API (Express) работают в одном Node.js процессе на
Railway и используют один файл SQLite. Фронтенд (React/Vite) деплоится
на Netlify.

## Структура

```
backend/   Express API + Telegraf-бот, один процесс, одна БД (SQLite)
frontend/  React/Vite Mini App
```

## Как это работает

- Покупатель открывает каталог в Mini App, выбирает товар и размер (если
  есть), заполняет форму (способ доставки, ФИО, телефон, адрес).
- Кнопка "Оформить заказ" неактивна, пока форма не заполнена корректно.
- Бэкенд валидирует данные, случайно выбирает один из наборов реквизитов
  оплаты (`backend/src/config/payments.js`) и сохраняет его прямо в заказе,
  создаёт заказ со статусом `pending` и **синхронно**, в этом же запросе,
  отправляет админу(ам) в Telegram карточку заказа с кнопками
  "Подтвердить оплату" / "Отменить".
- Фронтенд показывает экран с реквизитами и кнопкой "Скопировать".
- Админ нажимает кнопки в чате — сообщение перерисовывается (не стирается)
  с полной карточкой заказа и новым набором кнопок для нового статуса.
  Покупателю в личку уходит короткое уведомление о смене статуса.
- Статусы: `pending → paid → shipped → received`, либо `pending → cancelled`.
  Список статусов и соответствующие колонки дат — в
  `backend/src/config/statuses.js`, кнопки для каждого статуса выводятся
  из той же таблицы.
- `/orders` в чате бота (только для админов из `ADMIN_IDS`) — просмотр
  **всех** заказов за всё время, с фильтром сначала по статусу, потом по
  способу доставки. Карточки рендерятся той же функцией, что и уведомление
  при создании заказа.
- `/add_product` в чате бота (только для админов) — пошаговое добавление
  товара в каталог: название → описание → цена → категория (выбрать из
  существующих или ввести новую — так категория и "добавляется") →
  размеры → фото (можно прислать фотографией из Telegram, либо `-`, чтобы
  использовать нейтральную заглушку). `/cancel` прерывает мастер на любом
  шаге.

## Деплой

### 1. Backend → Railway

1. Создайте новый проект на Railway, укажите папку `backend` как корень
   сервиса (Root Directory = `backend`).
2. Добавьте volume (Railway → Settings → Volumes) и примонтируйте его,
   например, на `/data`. Это нужно для персистентности SQLite между
   деплоями/рестартами.
3. Переменные окружения (Settings → Variables):
   - `BOT_TOKEN` — токен бота от [@BotFather](https://t.me/BotFather)
   - `ADMIN_IDS` — Telegram ID админов через запятую (узнать свой ID можно
     у [@userinfobot](https://t.me/userinfobot))
   - `MINIAPP_URL` — URL фронтенда на Netlify (можно проставить после шага 2)
   - `CORS_ORIGIN` — тот же URL Netlify
   - `DB_PATH` — `/data/wanchenko.db` (путь внутри смонтированного volume)
4. Build command: `npm install`, Start command: `npm start`.
5. После первого деплоя один раз выполните `npm run seed` (Railway →
   служебный shell или Run command), чтобы наполнить каталог тестовыми
   товарами. Дальше товары добавляются командой `/add_product` в чате
   с ботом (см. выше) — отдельная админ-панель не нужна.

### 2. Frontend → Netlify

1. Новый сайт на Netlify, Base directory = `frontend`.
2. Build command: `npm run build`, Publish directory: `frontend/dist`.
3. Переменная окружения `VITE_API_URL` — URL бэкенда на Railway
   (например `https://wanchenko-backend.up.railway.app`).
4. После деплоя пропишите этот же URL в BotFather:
   `/setmenubutton` → URL Mini App, а также в `MINIAPP_URL` на Railway.

### 3. Настройка бота в BotFather

- `/newbot` — создать бота, получить `BOT_TOKEN`.
- `/setmenubutton` — указать URL Netlify как Mini App.
- (опционально) `/setcommands` — добавить:
  ```
  orders - Все заказы
  add_product - Добавить товар
  cancel - Отменить текущее действие
  ```

## Локальная разработка

```bash
cd backend
cp .env.example .env   # заполнить BOT_TOKEN, ADMIN_IDS
npm install
npm run seed
npm run dev

cd ../frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

Мини-приложение открывается только внутри Telegram (проверка подписи
`initData`). Для локальной отладки вне Telegram можно временно выставить
`ALLOW_DEBUG_AUTH=true` в backend `.env` — тогда бэкенд примет
`debugUser: { id, username, first_name }`, переданный с фронтенда, вместо
проверки `initData`. Не включайте эту переменную в продакшене.
