import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <Header />
      <div className="welcome">
        <div className="welcome__mark">wanchenko</div>
        <p className="welcome__about">
          Отобранные вещи из ресейла: верхняя одежда, обувь и аксессуары в ограниченном
          количестве. Каждая позиция — в единственном экземпляре.
        </p>
        <button className="btn" onClick={() => navigate('/catalog')}>
          Перейти в каталог
        </button>
      </div>
    </div>
  );
}
