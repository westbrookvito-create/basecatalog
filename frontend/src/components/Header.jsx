import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <>
      <header className="header">
        <button className="header__menu-btn" onClick={() => setMenuOpen(true)} aria-label="Меню">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header__name">@wanchenko</div>
        <div className="header__spacer" />
      </header>

      <div className={`menu-backdrop ${menuOpen ? 'menu-backdrop--open' : ''}`} onClick={close} />
      <nav className={`menu-drawer ${menuOpen ? 'menu-drawer--open' : ''}`}>
        <button className="menu-drawer__close" onClick={close} aria-label="Закрыть">
          ✕
        </button>
        <Link to="/" className="menu-drawer__link" onClick={close}>
          О магазине
        </Link>
        <Link to="/catalog" className="menu-drawer__link" onClick={close}>
          Каталог
        </Link>
        <Link to="/profile" className="menu-drawer__link" onClick={close}>
          Профиль
        </Link>
        <a
          href="https://t.me/wanchenko"
          target="_blank"
          rel="noreferrer"
          className="menu-drawer__link"
          onClick={close}
        >
          Написать в Telegram
        </a>
      </nav>
    </>
  );
}
