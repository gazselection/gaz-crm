interface Props {
  onMenu: () => void;
}
export function Topbar({ onMenu }: Props) {
  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/gaz-logo.png" alt="Gaz" />
        <h1>Gaz Sélection</h1>
      </div>
      <button className="menu-btn" onClick={onMenu} aria-label="Menu">
        ☰
      </button>
    </div>
  );
}
