import { NavLink } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/factures', label: 'Factures & Devis', icon: '📄' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' }
];

export function Nav({ open, onClose }: Props) {
  return (
    <nav className={'nav' + (open ? ' open' : '')}>
      <div className="nav-logo">
        <img src="/gaz-logo.png" alt="Gaz" />
        <div className="nav-logo-text">
          <h1>Gaz Sélection</h1>
          <p>CRM B2B CBD</p>
        </div>
      </div>
      <div className="nav-section">Navigation</div>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          onClick={onClose}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span>{it.icon}</span>
          <span>{it.label}</span>
        </NavLink>
      ))}
      <div className="nav-foot">
        v1.0 • {new Date().getFullYear()}
        <br />
        Auto-entrepreneur • SIRET 92030948100017
      </div>
    </nav>
  );
}
