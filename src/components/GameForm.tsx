import type { FormEvent } from 'react';

import type { GameDraft, SportName } from '../types';

type GameFormProps = {
  draft: GameDraft;
  sports: SportName[];
  onChange: (nextDraft: GameDraft) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function GameForm({ draft, sports, onChange, onSubmit, onClose }: GameFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <section className="form-card" aria-label="Create a pickup game">
      <div className="form-header">
        <div>
          <p className="eyebrow">Create listing</p>
          <h2>Post a pickup game</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Hide form
        </button>
      </div>

      <form className="game-form" onSubmit={handleSubmit}>
        <label>
          Sport
          <select
            value={draft.sport}
            onChange={(event) => onChange({ ...draft, sport: event.target.value })}
          >
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>

        <label>
          Location
          <input
            value={draft.location}
            onChange={(event) => onChange({ ...draft, location: event.target.value })}
            placeholder="Campus gym, park, or field"
            required
          />
        </label>

        <label>
          Date and time
          <input
            type="datetime-local"
            value={draft.startTime}
            onChange={(event) => onChange({ ...draft, startTime: event.target.value })}
            required
          />
        </label>

        <label>
          Capacity
          <input
            type="number"
            min={2}
            max={30}
            value={draft.capacity}
            onChange={(event) =>
              onChange({
                ...draft,
                capacity: Number(event.target.value),
              })
            }
            required
          />
        </label>

        <label>
          Organizer
          <input
            value={draft.organizer}
            onChange={(event) => onChange({ ...draft, organizer: event.target.value })}
            placeholder="Your name"
            required
          />
        </label>

        <label>
          Notes
          <textarea
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
            placeholder="Skill level, what to bring, game format..."
            rows={4}
          />
        </label>

        <button className="primary-button" type="submit">
          Publish game
        </button>
      </form>
    </section>
  );
}
