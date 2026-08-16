import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/product/${product.id}`}>
      <img className="product-card__image" src={product.images[0]} alt={product.title} loading="lazy" />
      <div className="product-card__title">{product.title}</div>
      <div className="product-card__price">{product.price.toLocaleString('ru-RU')} ₽</div>
    </Link>
  );
}
