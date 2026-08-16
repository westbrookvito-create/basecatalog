import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Banner from '../components/Banner.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { fetchConfig } from '../api.js';

export default function Welcome() {
  const navigate = useNavigate();
  const [bannerImage, setBannerImage] = useState(null);

  useEffect(() => {
    fetchConfig()
      .then((c) => setBannerImage(c.banner?.active ? c.banner.image : null))
      .catch(() => {});
  }, []);

  return (
    <div className="page page--with-nav">
      <Header />
      <Banner image={bannerImage} />

      <button className="link-cta" onClick={() => navigate('/catalog')}>
        Перейти в каталог <span aria-hidden="true">→</span>
      </button>

      <p className="welcome-about">
        Отобранные вещи из ресейла: верхняя одежда, обувь и аксессуары в ограниченном
        количестве. Каждая позиция — в единственном экземпляре.
      </p>

      <BottomNav />
    </div>
  );
}
