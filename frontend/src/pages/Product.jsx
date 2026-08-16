import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import { fetchProduct } from '../api.js';
import { hapticSelection } from '../telegram.js';

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(false);
  const [size, setSize] = useState(null);

  useEffect(() => {
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <Header />
        <div className="state state--error">Товар не найден</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page">
        <Header />
        <div className="state">Загрузка…</div>
      </div>
    );
  }

  const needsSize = product.sizes.length > 0;
  const canOrder = !needsSize || !!size;

  return (
    <div className="page">
      <Header />
      <button className="back-link" onClick={() => navigate('/catalog')}>
        ← Каталог
      </button>
      <div className="product">
        <img className="product__image" src={product.images[0]} alt={product.title} />
        <div className="product__body">
          <div>
            <div className="product__title">{product.title}</div>
            <div className="product__price">{product.price.toLocaleString('ru-RU')} ₽</div>
          </div>

          {product.description && <p className="product__description">{product.description}</p>}

          {needsSize && (
            <div>
              <div className="section-label">Размер</div>
              <div className="size-grid">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    className={`size-pill ${size === s ? 'size-pill--active' : ''}`}
                    onClick={() => {
                      setSize(s);
                      hapticSelection();
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky-footer">
        <button
          className="btn"
          disabled={!canOrder}
          onClick={() => navigate(`/product/${product.id}/order`, { state: { size } })}
        >
          Заказать
        </button>
      </div>
    </div>
  );
}
