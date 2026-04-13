import type { FormEvent } from 'react';
import { useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { ageRanges, locations } from '../data';
import { formatGameTime } from '../lib/datetime';
import { sportEmoji } from '../lib/sports';
import type { GameDraft, PickupGame, SportName } from '../types';
import { Button } from './ui/Button';

const defaultCourt: Record<SportName, string> = {
  Soccer: 'Hutchson Field',
  Frisbee: 'Deering Meadow',
  Tennis: 'Northwestern Tennis Courts',
};

type GameFormProps = {
  draft: GameDraft;
  sports: SportName[];
  games: PickupGame[];
  onChange: (nextDraft: GameDraft) => void;
  onSubmit: () => void;
  onClose: () => void;
  conflictGame: PickupGame | null;
  onViewConflictGame: (id: string) => void;
};

export function GameForm({
  draft,
  sports,
  games,
  onChange,
  onSubmit,
  onClose,
  conflictGame,
  onViewConflictGame,
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

  const selectedLocationInfo = draft.location ? locations[draft.location] : null;

  const availableStartTimes = useMemo(() => {
    if (!draft.location || !draft.date || !locations[draft.location]) return [];
    const locInfo = locations[draft.location];
    let allowedSlots = timeSlots;

    if (locInfo.availability !== 'anytime') {
      const date = new Date(draft.date + 'T00:00:00');
      const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const day = days[date.getDay()];
      const avail = locInfo.availability[day];
      if (avail) {
        allowedSlots = timeSlots.filter(
          (slot) => slot >= avail.start && slot <= avail.end,
        );
      }
    }

    const today = new Date().toISOString().split('T')[0];
    if (draft.date === today) {
      const now = new Date();
      allowedSlots = allowedSlots.filter((slot) => {
        const slotTime = new Date(`${draft.date}T${slot}:00`);
        return slotTime > now;
      });
    }

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

  function firstValidationError(): string | null {
    if (!draft.sport) return 'Select a sport.';
    if (!draft.location) return 'Select a court or venue.';
    if (!draft.date) return 'Choose a date.';
    if (!draft.startTime) return 'Choose a start time.';
    if (!draft.endTime) return 'Choose an end time.';
    if (!draft.ageRange) return 'Select an age range.';
    if (draft.capacity < 2 || draft.capacity > 30) return 'Capacity must be between 2 and 30.';
    if (conflictGame) return 'A game already exists at that time. Pick another slot.';
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = firstValidationError();
    if (error) {
      toast.error(error);
      return;
    }
    onSubmit();
  }

  function formatAvailability() {
    if (!selectedLocationInfo) return null;
    if (selectedLocationInfo.availability === 'anytime') return 'Available anytime';
    const entries = Object.entries(selectedLocationInfo.availability);
    if (entries.length === 0) return null;
    const [, first] = entries[0];
    const [, last] = entries[entries.length - 1];
    const days = entries.map(([d]) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
    return `${days}: ${first.start}–${last.end}`;
  }

  const inputClass =
    'w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-cream placeholder:text-cream/40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-400';

  return (
    <section
      className="mx-auto w-full max-w-2xl rounded-2xl border border-white/12 bg-[rgba(9,15,24,0.72)] p-6 shadow-[0_24px_60px_rgba(2,8,18,0.3)] backdrop-blur-xl md:p-8"
      aria-label="Host a pickup game"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-cream">
          Host a Pickup Game
        </h1>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-cream-muted underline-offset-4 hover:underline"
        >
          Back to games
        </button>
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div>
          <p className="mb-3 text-sm font-semibold text-cream">Sport</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {sports.map((sport) => {
              const selected = draft.sport === sport;
              const venue = defaultCourt[sport];
              const addr = locations[venue]?.address ?? '';
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...draft,
                      sport,
                      location: venue,
                      date: draft.date || new Date().toISOString().split('T')[0],
                      startTime: '',
                      endTime: '',
                    })
                  }
                  className={`flex min-h-[44px] flex-col rounded-2xl border-2 p-4 text-left transition ${
                    selected
                      ? 'border-brand-400 bg-brand-400/10 shadow-[0_0_0_1px_rgba(248,211,106,0.25)]'
                      : 'border-white/12 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-3xl" aria-hidden>
                    {sportEmoji(sport)}
                  </span>
                  <span className="mt-2 font-bold text-cream">{sport}</span>
                  {selected && (
                    <span className="mt-2 text-xs leading-snug text-cream-muted">
                      {venue}
                      <br />
                      {addr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-cream">
          Court / venue
          <select
            className={inputClass}
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

        {selectedLocationInfo && (
          <p className="-mt-4 text-sm text-sky-accent">⏰ {formatAvailability()}</p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-semibold text-cream md:col-span-1">
            Date
            <input
              type="date"
              className={inputClass}
              value={draft.date}
              onChange={(event) =>
                onChange({
                  ...draft,
                  date: event.target.value,
                  startTime: '',
                  endTime: '',
                })
              }
              disabled={!draft.sport}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cream">
            Start time
            <select
              className={inputClass}
              value={
                draft.startTime
                  ? new Date(draft.startTime).toTimeString().slice(0, 5)
                  : ''
              }
              onChange={(event) =>
                onChange({
                  ...draft,
                  startTime: `${draft.date}T${event.target.value}:00`,
                  endTime: '',
                })
              }
              disabled={!draft.location || !draft.date}
              required
            >
              <option value="">Select start time</option>
              {availableStartTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cream">
            End time
            <select
              className={inputClass}
              value={
                draft.endTime ? new Date(draft.endTime).toTimeString().slice(0, 5) : ''
              }
              onChange={(event) =>
                onChange({ ...draft, endTime: `${draft.date}T${event.target.value}:00` })
              }
              disabled={!draft.startTime}
              required
            >
              <option value="">Select end time</option>
              {availableEndTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-cream">Capacity (required players)</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg font-bold text-cream"
              onClick={() => onChange({ ...draft, capacity: Math.max(2, draft.capacity - 1) })}
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-lg font-bold text-cream">
              {draft.capacity}
            </span>
            <button
              type="button"
              className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-lg font-bold text-cream"
              onClick={() => onChange({ ...draft, capacity: Math.min(30, draft.capacity + 1) })}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-cream">Skill level</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/12 bg-white/5 p-1">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((label) => {
              const active = draft.skillLevel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ ...draft, skillLevel: label })}
                  className={`min-h-11 rounded-xl px-2 text-xs font-bold sm:text-sm ${
                    active
                      ? 'bg-gradient-to-br from-brand-500 to-brand-400 text-ink shadow-sm'
                      : 'text-cream-muted hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <label className="grid gap-2 text-sm font-semibold text-cream">
          Description
          <textarea
            className={`${inputClass} min-h-[120px] resize-y`}
            value={draft.note}
            onChange={(event) => onChange({ ...draft, note: event.target.value })}
            placeholder="Share format, what to bring, and how to find the group…"
            rows={4}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-cream">
            Age range
            <select
              className={inputClass}
              value={draft.ageRange}
              onChange={(event) => onChange({ ...draft, ageRange: event.target.value })}
              required
            >
              <option value="">Select age range</option>
              {ageRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-cream">
            Gender
            <select
              className={inputClass}
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
        </div>

        <label className="grid gap-2 text-sm font-semibold text-cream">
          Requirements
          <textarea
            className={`${inputClass} min-h-[88px] resize-y`}
            value={draft.requirements}
            onChange={(event) => onChange({ ...draft, requirements: event.target.value })}
            placeholder="Cleats, discs, rackets, water…"
            rows={2}
          />
        </label>

        {conflictGame && (
          <div className="rounded-xl border border-amber-400/45 bg-amber-400/10 p-4 text-amber-100">
            <p className="text-sm font-bold">
              ⚠️ A game is already scheduled at this time. Pick another slot or open the
              existing game.
            </p>
            <p className="mt-1 text-sm text-amber-100/90">
              {conflictGame.sport} at {conflictGame.location} ·{' '}
              {formatGameTime(conflictGame.startTime)}
            </p>
            <div className="mt-4">
              <Button
                type="button"
                className="w-full justify-center sm:w-auto"
                onClick={() => onViewConflictGame(conflictGame.id)}
              >
                View &amp; Join Game
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg border-l-4 border-brand-400 bg-brand-400/10 p-4 text-sm text-cream">
          📌 You are responsible for reserving this court before posting this game.
        </div>

        <Button
          type="submit"
          className="w-full justify-center py-3.5 text-base"
        >
          Post Game
        </Button>

        <p className="text-center text-xs text-cream-muted">
          Choose the level that best matches expected pace and experience.
        </p>
      </form>
    </section>
  );
}
