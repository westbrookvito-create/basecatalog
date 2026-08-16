import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { fetchProducts } from '../api.js';

export default function Catalog() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  return (
    <div className="page page--with-nav">
      <Header />
      {error && <div className="state state--error">Не удалось загрузить каталог</div>}
      {!error && !products && <div className="state">Загрузка…</div>}
      {products && products.length === 0 && <div className="state">Пока пусто</div>}
      {products && products.length > 0 && (
        <div className="catalog">
          <div className="catalog__grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
