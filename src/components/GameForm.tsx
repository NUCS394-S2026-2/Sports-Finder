import type { FormEvent } from 'react';
import { useMemo } from 'react';

import { locations, skillLevels } from '../data';
import type { GameDraft, PickupGame, SportName } from '../types';

type GameFormProps = {
  draft: GameDraft;
  sports: SportName[];
  games: PickupGame[];
  onChange: (nextDraft: GameDraft) => void;
  onSubmit: () => void;
  onClose: () => void;
};

export function GameForm({
  draft,
  sports,
  games,
  onChange,
  onSubmit,
  onClose,
}: GameFormProps) {
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let min = 0; min < 60; min += 15) {
        slots.push(
          `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        );
      }
    }
    return slots;
  }, []);

  const availableLocations = useMemo(() => {
    if (!draft.sport) return [];
    return Object.keys(locations).filter((loc) =>
      locations[loc].sports.includes(draft.sport as SportName),
    );
  }, [draft.sport]);

  const availableStartTimes = useMemo(() => {
    if (!draft.location || !draft.date || !locations[draft.location]) return [];
    const locInfo = locations[draft.location];
    let allowedSlots = timeSlots;
    if (locInfo.availability !== 'anytime') {
      const date = new Date(draft.date);
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const day = days[date.getDay()];
      const avail = locInfo.availability[day];
      if (avail) {
        allowedSlots = timeSlots.filter(
          (slot) => slot >= avail.start && slot <= avail.end,
        );
      }
    }
    // Filter out conflicts
    return allowedSlots.filter((slot) => {
      const slotTime = new Date(`${draft.date}T${slot}:00`).getTime();
      return !games.some(
        (g) =>
          g.location === draft.location &&
          new Date(g.startTime).toDateString() === new Date(draft.date).toDateString() &&
          Math.abs(new Date(g.startTime).getTime() - slotTime) < 30 * 60 * 1000,
      );
    });
  }, [draft.location, draft.date, games, timeSlots]);

  const availableEndTimes = useMemo(() => {
    if (!draft.startTime) return [];
    const startTime = new Date(draft.startTime).getTime();
    const slots = [];
    for (let offset = 15; offset <= 180; offset += 15) {
      const endTime = new Date(startTime + offset * 60 * 1000);
      slots.push(endTime.toTimeString().slice(0, 5));
    }
    return slots;
  }, [draft.startTime]);

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
            onChange={(event) =>
              onChange({
                ...draft,
                sport: event.target.value as SportName,
                location: '',
                date: '',
                startTime: '',
                endTime: '',
              })
            }
          >
            <option value="">Select a sport</option>
            {sports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={draft.date}
            onChange={(event) =>
              onChange({ ...draft, date: event.target.value, startTime: '', endTime: '' })
            }
            disabled={!draft.sport}
            min={new Date().toISOString().split('T')[0]}
          />
        </label>

        <label>
          Location
          <select
            value={draft.location}
            onChange={(event) =>
              onChange({
                ...draft,
                location: event.target.value,
                startTime: '',
                endTime: '',
              })
            }
            disabled={!draft.sport}
          >
            <option value="">Select a location</option>
            {availableLocations.map((loc: string) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start Time
          <select
            value={
              draft.startTime ? new Date(draft.startTime).toTimeString().slice(0, 5) : ''
            }
            onChange={(event) =>
              onChange({
                ...draft,
                startTime: `${draft.date}T${event.target.value}:00`,
                endTime: '',
              })
            }
            disabled={!draft.location || !draft.date}
          >
            <option value="">Select start time</option>
            {availableStartTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>

        <label>
          End Time
          <select
            value={
              draft.endTime ? new Date(draft.endTime).toTimeString().slice(0, 5) : ''
            }
            onChange={(event) =>
              onChange({ ...draft, endTime: `${draft.date}T${event.target.value}:00` })
            }
            disabled={!draft.startTime}
          >
            <option value="">Select end time</option>
            {availableEndTimes.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
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
          Skill Level
          <select
            value={draft.skillLevel}
            onChange={(event) =>
              onChange({
                ...draft,
                skillLevel: event.target.value as GameDraft['skillLevel'],
              })
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
          Age Range
          <input
            type="text"
            value={draft.ageRange}
            onChange={(event) => onChange({ ...draft, ageRange: event.target.value })}
            placeholder="e.g. 18+ or 16-25"
            required
          />
        </label>

        <label>
          Gender
          <select
            value={draft.gender}
            onChange={(event) =>
              onChange({ ...draft, gender: event.target.value as GameDraft['gender'] })
            }
          >
            <option value="Any">Any</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Mixed">Mixed</option>
          </select>
        </label>

        <label>
          Description
          <textarea
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
            placeholder="Details about the game..."
            rows={4}
          />
        </label>

        <label>
          Requirements
          <textarea
            value={draft.requirements}
            onChange={(event) => onChange({ ...draft, requirements: event.target.value })}
            placeholder="Any requirements..."
            rows={2}
          />
        </label>

        <div className="warning">
          <p>
            <strong>Important:</strong> We are unable to guarantee the availability of the
            play area. Creators of a game are responsible for ensuring that the location
            is usable at the time of the game.
          </p>
        </div>

        <button className="primary-button" type="submit">
          Create Game
        </button>
      </form>
    </section>
  );
}
