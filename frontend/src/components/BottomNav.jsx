import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Главное', end: true },
  { to: '/catalog', label: 'Каталог' },
  { to: '/profile', label: 'Профиль' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
