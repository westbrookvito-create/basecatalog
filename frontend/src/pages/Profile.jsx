import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { fetchMyOrders } from '../api.js';
import { getTelegramUser } from '../telegram.js';
import { STATUS_LABELS } from '../constants.js';

export default function Profile() {
  const navigate = useNavigate();
  const tgUser = getTelegramUser();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setError('Откройте приложение через Telegram, чтобы увидеть заказы'));
  }, []);

  const displayName =
    [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ') || 'Гость';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="page page--with-nav">
      <Header />

      <div className="profile">
        <div className="profile__user">
          <div className="profile__avatar">{initial}</div>
          <div>
            <div className="profile__name">{displayName}</div>
            {tgUser?.username && <div className="profile__username">@{tgUser.username}</div>}
          </div>
        </div>

        <div className="section-label">Мои заказы</div>

        {error && <div className="state state--error">{error}</div>}
        {!error && !orders && <div className="state">Загрузка…</div>}
        {orders && orders.length === 0 && <div className="state">Заказов пока нет</div>}

        {orders && orders.length > 0 && (
          <div className="order-list">
            {orders.map((o) => (
              <button key={o.id} className="order-list__item" onClick={() => navigate(`/order/${o.id}`)}>
                <div className="order-list__row">
                  <span>Заказ №{o.id}</span>
                  <span>{STATUS_LABELS[o.status] || o.status}</span>
                </div>
                <div className="order-list__title">
                  {o.product_title}
                  {o.size ? ` · ${o.size}` : ''}
                </div>
                <div className="order-list__price">{o.total_price.toLocaleString('ru-RU')} ₽</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
