import { NavLink } from 'react-router-dom';

function IconHome({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9h12v-9" />
    </svg>
  );
}

function IconStore({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9.5 5 4h14l1 5.5" />
      <path d="M4.5 9.5v10h15v-10" />
      <path d="M9.5 19.5v-6h5v6" />
    </svg>
  );
}

function IconUser({ active }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.2 3.6-6.5 8-6.5s8 2.3 8 6.5" />
    </svg>
  );
}

const ITEMS = [
  { to: '/', label: 'Главное', end: true, Icon: IconHome },
  { to: '/catalog', label: 'Каталог', Icon: IconStore },
  { to: '/profile', label: 'Профиль', Icon: IconUser },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon active={isActive} />
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
