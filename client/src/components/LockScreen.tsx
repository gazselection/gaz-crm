import { useState } from 'react';

interface Props {
  onUnlock: () => void;
  password: string;
}

export function LockScreen({ onUnlock, password }: Props) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleKey(digit: string) {
    if (input.length >= 8) return;
    const next = input + digit;
    setInput(next);
    setError(false);
    if (next === password) {
      setTimeout(() => onUnlock(), 150);
    } else if (next.length >= password.length) {
      setError(true);
      setTimeout(() => setInput(''), 600);
    }
  }

  function handleDelete() {
    setInput((v) => v.slice(0, -1));
    setError(false);
  }

  return (
    <div className="lock-screen">
      <div className="lock-box">
        <div className="lock-logo">🔒</div>
        <div className="lock-title">Gaz Sélection CBD</div>
        <div className="lock-subtitle">Entrez votre code PIN</div>
        <div className={`lock-dots${error ? ' lock-dots--error' : ''}`}>
          {Array.from({ length: Math.max(password.length, 4) }).map((_, i) => (
            <span key={i} className={`lock-dot${i < input.length ? ' filled' : ''}`} />
          ))}
        </div>
        {error && <div className="lock-error">Code incorrect</div>}
        <div className="lock-keypad">
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <button
              key={i}
              className={`lock-key${k === '' ? ' lock-key--empty' : ''}${k === '⌫' ? ' lock-key--del' : ''}`}
              onClick={() => k === '⌫' ? handleDelete() : k !== '' ? handleKey(k) : undefined}
              disabled={k === ''}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
