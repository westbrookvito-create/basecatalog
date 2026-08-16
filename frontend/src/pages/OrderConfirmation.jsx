import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { fetchOrder } from '../api.js';
import { hapticNotification } from '../telegram.js';

const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  received: 'Получен',
  cancelled: 'Отменён',
};

const DELIVERY_LABELS = {
  cdek: 'СДЭК',
  russian_post: 'Почта России',
  yandex: 'Яндекс Доставка',
};

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [order, setOrder] = useState(location.state?.order || null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setError('Не удалось загрузить заказ'));
  }, [id, order]);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(order.payment_requisites.number);
      setCopied(true);
      hapticNotification('success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (error) {
    return (
      <div className="page">
        <Header />
        <div className="state state--error">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page">
        <Header />
        <div className="state">Загрузка…</div>
      </div>
    );
  }

  const req = order.payment_requisites;

  return (
    <div className="page">
      <Header />
      <div className="confirmation">
        <div>
          <div className="confirmation__title">Заказ №{order.id} оформлен</div>
          <p className="confirmation__subtitle">
            Статус: {STATUS_LABELS[order.status] || order.status}. Переведите сумму по
            реквизитам ниже — после проверки платежа администратор подтвердит заказ.
          </p>
        </div>

        <div className="requisites">
          <div className="requisites__row">
            <span>Банк</span>
            <span>{req.bank}</span>
          </div>
          <div className="requisites__row">
            <span>Получатель</span>
            <span>{req.holder}</span>
          </div>
          <div className="requisites__number">{req.number}</div>
          <button className="btn btn--outline" onClick={copyNumber}>
            {copied ? 'Скопировано' : 'Скопировать номер'}
          </button>
        </div>

        <div className="order-meta">
          <div>Товар: {order.product_title}{order.size ? ` · ${order.size}` : ''}</div>
          <div>Сумма: {order.total_price.toLocaleString('ru-RU')} ₽</div>
          <div>Доставка: {DELIVERY_LABELS[order.delivery_method] || order.delivery_method}</div>
          <div>Получатель: {order.recipient_name}</div>
          <div>Телефон: {order.phone}</div>
          <div>Адрес: {order.address}</div>
        </div>

        <button className="btn" onClick={() => navigate('/catalog')}>
          В каталог
        </button>
      </div>
    </div>
  );
}
