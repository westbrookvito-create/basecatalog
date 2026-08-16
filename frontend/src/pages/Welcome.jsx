import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Banner from '../components/Banner.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { fetchConfig } from '../api.js';

export default function Welcome() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetchConfig()
      .then((c) => setBanner(c.banner?.active ? c.banner.text : null))
      .catch(() => {});
  }, []);

  return (
    <div className="page page--with-nav">
      <Header />
      <Banner text={banner} />
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
      <BottomNav />
    </div>
  );
}
