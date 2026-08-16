import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasPhoto = product.images?.length > 0 && !imgFailed;

  return (
    <Link className="product-card" to={`/product/${product.id}`}>
      {hasPhoto ? (
        <img
          className="product-card__image"
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div className="product-card__image product-card__no-photo">No photo</div>
      )}
      <div className="product-card__title">{product.title}</div>
      <div className="product-card__price">{product.price.toLocaleString('ru-RU')} ₽</div>
      {product.sizes?.length > 0 && (
        <div className="product-card__size">{product.sizes.join(', ')}</div>
      )}
    </Link>
  );
}
