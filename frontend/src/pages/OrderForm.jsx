import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { fetchProduct, fetchConfig, createOrder } from '../api.js';

const ERROR_MESSAGES = {
  product_not_found: 'Товар недоступен',
  invalid_size: 'Выберите корректный размер',
  invalid_delivery_method: 'Выберите способ доставки',
  recipient_name_required: 'Укажите ФИО получателя',
  invalid_phone: 'Укажите корректный телефон',
  address_required: 'Укажите адрес получения',
  invalid_telegram_auth: 'Не удалось подтвердить пользователя Telegram',
};

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const size = location.state?.size || null;

  const [product, setProduct] = useState(null);
  const [deliveryMethods, setDeliveryMethods] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchProduct(id).then(setProduct).catch(() => setError('Товар не найден'));
    fetchConfig().then((c) => setDeliveryMethods(c.deliveryMethods));
  }, [id]);

  const isValid =
    deliveryMethod &&
    recipientName.trim().length >= 2 &&
    phone.replace(/\D/g, '').length >= 10 &&
    address.trim().length >= 5;

  async function handleSubmit() {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const order = await createOrder({
        productId: Number(id),
        size,
        deliveryMethod,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        comment: comment.trim(),
      });
      navigate(`/order/${order.id}`, { state: { order } });
    } catch (err) {
      setError(ERROR_MESSAGES[err.code] || 'Не удалось оформить заказ, попробуйте ещё раз');
      setSubmitting(false);
    }
  }

  if (!product) {
    return (
      <div className="page">
        <Header />
        <div className="state">{error || 'Загрузка…'}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <button className="back-link" onClick={() => navigate(-1)}>
        ← Назад
      </button>

      <div className="form">
        <div>
          <div className="section-label">Заказ</div>
          <div style={{ fontSize: 14 }}>
            {product.title}
            {size ? ` · ${size}` : ''} — {product.price.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div>
          <div className="section-label">Способ доставки</div>
          <div className="option-list">
            {deliveryMethods.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`option-pill ${deliveryMethod === m.id ? 'option-pill--active' : ''}`}
                onClick={() => setDeliveryMethod(m.id)}
              >
                <span className="option-pill__dot" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="recipientName">ФИО получателя</label>
          <input
            id="recipientName"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Иванова Мария Сергеевна"
          />
        </div>

        <div className="field">
          <label htmlFor="phone">Телефон</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 000 00 00"
          />
        </div>

        <div className="field">
          <label htmlFor="address">Адрес получения</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Город, улица, дом, квартира, индекс"
          />
        </div>

        <div className="field">
          <label htmlFor="comment">Комментарий (необязательно)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Пожелания к заказу"
          />
        </div>

        {error && <div className="state state--error" style={{ padding: 0 }}>{error}</div>}
      </div>

      <div className="sticky-footer">
        <button className="btn" disabled={!isValid || submitting} onClick={handleSubmit}>
          {submitting ? 'Оформляем…' : 'Оформить заказ'}
        </button>
      </div>
    </div>
  );
}
