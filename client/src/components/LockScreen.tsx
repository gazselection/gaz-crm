import { useState, useEffect, useRef } from 'react';

const LOCK_KEY = 'gazcrm_lock_pwd';
const DEFAULT_PWD = '1234';

interface Props {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function check() {
    const stored = localStorage.getItem(LOCK_KEY) || DEFAULT_PWD;
    if (value === stored) {
      onUnlock();
    } else {
      setError(true);
      setValue('');
      setTimeout(() => setError(false), 2000);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0D0D0D', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20
    }}>
      <div style={{
        width: 72, height: 72, background: '#D4A017', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, fontWeight: 900, color: '#0D0D0D', letterSpacing: '-1px'
      }}>G</div>

      <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0', letterSpacing: '-0.5px' }}>
        Gaz Sélection CRM
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 280 }}>
        <input
          ref={inputRef}
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="Mot de passe"
          style={{
            width: '100%', padding: '12px 16px', fontSize: 16, borderRadius: 10,
            border: error ? '2px solid #E74C3C' : '2px solid #333',
            background: '#1a1a1a', color: '#F0F0F0', outline: 'none',
            textAlign: 'center', letterSpacing: 4, transition: 'border-color 0.2s'
          }}
        />
        {error && (
          <div style={{ color: '#E74C3C', fontSize: 13, fontWeight: 600 }}>
            Mot de passe incorrect
          </div>
        )}
        <button
          onClick={check}
          style={{
            width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 700,
            background: '#D4A017', color: '#0D0D0D', border: 'none',
            borderRadius: 10, cursor: 'pointer'
          }}
        >
          Déverrouiller
        </button>
      </div>
    </div>
  );
}

export { LOCK_KEY, DEFAULT_PWD };
