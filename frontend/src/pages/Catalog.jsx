import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header.jsx';
import BottomNav from '../components/BottomNav.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { fetchProducts } from '../api.js';

export default function Catalog() {
  const [products, setProducts] = useState(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(() => setError(true));
  }, []);

  const categories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map((p) => p.category).filter(Boolean))];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) => (!category || p.category === category) && (!q || p.title.toLowerCase().includes(q))
    );
  }, [products, category, query]);

  return (
    <div className="page page--with-nav">
      <Header />

      {products && products.length > 0 && (
        <>
          {categories.length > 1 && (
            <div className="filter-pills">
              <button
                className={`filter-pill ${!category ? 'filter-pill--active' : ''}`}
                onClick={() => setCategory(null)}
              >
                Все
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`filter-pill ${category === c ? 'filter-pill--active' : ''}`}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="search-bar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск…"
            />
          </div>
        </>
      )}

      {error && <div className="state state--error">Не удалось загрузить каталог</div>}
      {!error && !products && <div className="state">Загрузка…</div>}
      {products && products.length === 0 && <div className="state">Пока пусто</div>}
      {products && products.length > 0 && filtered.length === 0 && (
        <div className="state">Ничего не найдено</div>
      )}
      {filtered.length > 0 && (
        <div className="catalog">
          <div className="catalog__grid">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
