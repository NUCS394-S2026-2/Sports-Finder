import { useState } from 'react';

import type { PickupGame } from '../types';

type JoinModalProps = {
  game: PickupGame;
  onConfirm: (name: string, email: string) => void;
  onClose: () => void;
};

export function JoinModal({ game, onConfirm, onClose }: JoinModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);

  function handleSubmit() {
    if (!name.trim() || !email.trim()) return;
    onConfirm(name, email);
    setJoined(true);
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(game.location)}`;

  const linkStyle = {
    display: 'block',
    textAlign: 'center' as const,
    padding: '10px',
    background: '#f5a623',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    textDecoration: 'none',
  };

  const hostBoxStyle = {
    background: '#2a2a2a',
    borderRadius: '8px',
    padding: '12px',
  };

  if (joined) {
    return (
      <div className="modal-overlay">
        <div className="modal-card">
          <h2>You&apos;re in! 🎉</h2>
          <p>
            You&apos;ve joined <strong>{game.sport}</strong> at{' '}
            <strong>{game.location}</strong>.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <a href={mapsUrl} target="_blank" rel="noreferrer" style={linkStyle}>
              📍 Open in Google Maps
            </a>
            <div style={hostBoxStyle}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>HOST</p>
              <p style={{ margin: 0 }}>{game.organizer}</p>
            </div>
            <button type="button" className="ghost-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>
          Join {game.sport} at {game.location}
        </h2>
        <p className="game-time">{game.startTime}</p>
        <label>
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emily"
            required
          />
        </label>
        <label>
          Your email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. emily@u.northwestern.edu"
            required
          />
        </label>
        <button
          type="button"
          className="primary-button"
          onClick={handleSubmit}
          disabled={!name.trim() || !email.trim()}
        >
          Confirm join
        </button>
        <button type="button" className="ghost-button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
