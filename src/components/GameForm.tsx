import type { FormEvent } from 'react';

import { ageRanges, genders, openLocations, skillLevels } from '../data';
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

  function handleSportChange(sport: string) {
    if (sport === 'Tennis') {
      onChange({ ...draft, sport, location: 'Northwestern Tennis Courts' });
    } else {
      onChange({ ...draft, sport, location: '' });
    }
  }

  const isTennis = draft.sport === 'Tennis';

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
            onChange={(event) => handleSportChange(event.target.value)}
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
          {isTennis ? (
            <input value="Northwestern Tennis Courts" disabled />
          ) : (
            <select
              value={draft.location}
              onChange={(event) => onChange({ ...draft, location: event.target.value })}
              required
            >
              <option value="">Select a location</option>
              {openLocations
                .filter((loc) => loc !== 'Northwestern Tennis Courts')
                .map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
            </select>
          )}
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
              onChange({ ...draft, capacity: Number(event.target.value) })
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

        <label>
          Skill level
          <select
            value={draft.skillLevel}
            onChange={(event) =>
              onChange({ ...draft, skillLevel: event.target.value as GameDraft['skillLevel'] })
            }
          >
            {skillLevels.map((skillLevel) => (
              <option key={skillLevel} value={skillLevel}>
                {skillLevel}
              </option>
            ))}
          </select>
        </label>

        <label>
          Age range
          <select
            value={draft.ageRange}
            onChange={(event) =>
              onChange({ ...draft, ageRange: event.target.value as GameDraft['ageRange'] })
            }
          >
            {ageRanges.map((ageRange) => (
              <option key={ageRange} value={ageRange}>
                {ageRange}
              </option>
            ))}
          </select>
        </label>

        <label>
          Gender
          <select
            value={draft.gender}
            onChange={(event) =>
              onChange({ ...draft, gender: event.target.value as GameDraft['gender'] })
            }
          >
            {genders.map((gender) => (
              <option key={gender} value={gender}>
                {gender}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
          <input type="checkbox" required />
          I confirm I have secured this location and it is available for use.
        </label>

        <button className="primary-button" type="submit">
          Publish game
        </button>
      </form>
    </section>
  );
}
