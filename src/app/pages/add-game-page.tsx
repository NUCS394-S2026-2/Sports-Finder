import { ArrowLeft, Minus, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { PrimaryButton } from '../components/ui/app-buttons';
import { useAuth } from '../context/auth-context';
import type { Game } from '../context/games-context';
import { useGames } from '../context/games-context';
import { meetsMinimumHostLead } from '../lib/game-schedule';
import {
  DEERING_MEADOW,
  HUTCHINSON_FIELD,
  isWithinHutchinsonHours,
  NORTHWESTERN_TENNIS_COURTS,
} from '../lib/venues';

type SportId = 'Tennis' | 'Soccer' | 'Frisbee';
type FrisbeeField = 'deering' | 'hutchinson';

const SPORT_TILES: { id: SportId; emoji: string; label: string }[] = [
  { id: 'Tennis', emoji: '🎾', label: 'Tennis' },
  { id: 'Soccer', emoji: '⚽', label: 'Soccer' },
  { id: 'Frisbee', emoji: '🥏', label: 'Frisbee' },
];

function venueFor(sport: SportId, frisbeeField: FrisbeeField) {
  if (sport === 'Tennis') return NORTHWESTERN_TENNIS_COURTS;
  if (sport === 'Soccer') return HUTCHINSON_FIELD;
  return frisbeeField === 'deering' ? DEERING_MEADOW : HUTCHINSON_FIELD;
}

const LEVELS: Game['competitiveLevel'][] = ['Casual', 'Intermediate', 'Competitive'];
const GENDERS: Game['gender'][] = ['Co-ed', "Men's", "Women's"];

function isoToDisplay(iso: string) {
  if (!iso) return '';
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function minutesBetween(startHm: string, endHm: string): number | null {
  if (!startHm || !endHm) return null;
  const [startH, startM] = startHm.split(':').map(Number);
  const [endH, endM] = endHm.split(':').map(Number);
  if (
    Number.isNaN(startH) ||
    Number.isNaN(startM) ||
    Number.isNaN(endH) ||
    Number.isNaN(endM)
  ) {
    return null;
  }
  return endH * 60 + endM - (startH * 60 + startM);
}

export function AddGamePage() {
  const navigate = useNavigate();
  const { addGame, games } = useGames();
  const { user } = useAuth();

  const [sport, setSport] = useState<SportId>('Tennis');
  const [frisbeeField, setFrisbeeField] = useState<FrisbeeField>('deering');
  const venue = useMemo(() => venueFor(sport, frisbeeField), [sport, frisbeeField]);
  const isHutchinson = venue.name === HUTCHINSON_FIELD.name;
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [minPlayers, setMinPlayers] = useState(4);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [competitiveLevel, setCompetitiveLevel] =
    useState<Game['competitiveLevel']>('Casual');
  const [gender, setGender] = useState<Game['gender']>('Co-ed');
  const [notes, setNotes] = useState('');
  const [ignoreConflict, setIgnoreConflict] = useState(false);
  const [nowTick, setNowTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = date ? isoToDisplay(date) : '';
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const selectedDateIsPast = !!date && date < todayIso;

  const conflictingGame = useMemo(() => {
    if (!dateLabel || !time) return undefined;
    return games.find(
      (g) =>
        !g.cancelled &&
        g.location === venue.name &&
        g.date === dateLabel &&
        g.time === time,
    );
  }, [games, venue.name, dateLabel, time]);

  const showConflict = !!conflictingGame && !ignoreConflict;

  const hutchinsonOk =
    !isHutchinson ||
    !date ||
    !time ||
    !endTime ||
    isWithinHutchinsonHours(date, time, endTime);

  const fiveHoursLeadOk = useMemo(() => {
    void nowTick;
    if (!date || !time) return true;
    return meetsMinimumHostLead(date, time, Date.now());
  }, [date, time, nowTick]);

  const durationMinutes = useMemo(() => minutesBetween(time, endTime), [time, endTime]);
  const durationOk = durationMinutes !== null && durationMinutes >= 40;

  const formComplete =
    !!title.trim() &&
    !!date &&
    !!time &&
    !!endTime &&
    !selectedDateIsPast &&
    minPlayers >= 0 &&
    maxPlayers >= minPlayers &&
    maxPlayers >= 1 &&
    maxPlayers <= 30 &&
    durationOk &&
    hutchinsonOk &&
    fiveHoursLeadOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formComplete) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (showConflict) return;

    if (selectedDateIsPast) {
      toast.error('Please choose today or a future date.');
      return;
    }

    if (!durationOk) {
      toast.error('Game duration must be at least 40 minutes.');
      return;
    }

    if (isHutchinson && !isWithinHutchinsonHours(date, time, endTime)) {
      toast.error(
        `Hutchinson Field is only open ${HUTCHINSON_FIELD.hoursLine}. Pick a time in that window.`,
      );
      return;
    }

    if (!meetsMinimumHostLead(date, time, Date.now())) {
      toast.error('Games must be scheduled at least 5 hours from now.');
      return;
    }

    try {
      await addGame({
        sport,
        title: title.trim(),
        location: venue.name,
        address: venue.address,
        date: dateLabel,
        time,
        endTime,
        maxPlayers,
        minPlayers,
        competitiveLevel,
        gender,
        notes: notes.trim() || undefined,
        hostName: user?.displayName ?? 'Northwestern Host',
      });

      toast.success('Game created successfully!');
      navigate('/games');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'HOST_DUPLICATE_START_TIME') {
        toast.error('You already posted a game at this exact start time.');
        return;
      }
      if (code === 'HOST_ACTIVE_GAMES_LIMIT') {
        toast.error('You cannot have more than 3 active hosted games.');
        return;
      }
      toast.error('Could not create game. Please try again.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-0 pb-8">
      <div className="rounded-2xl bg-white p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] md:p-8">
        <div className="mb-6 flex items-center gap-4 lg:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-text-primary"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-text-primary">
          Host a Pickup Game
        </h1>
        <p className="mt-2 text-text-secondary">
          We only support Northwestern Tennis Courts, Hutchinson Field, and Deering Meadow
          — each with the hours shown below.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-10">
          <section className="space-y-4">
            <p className="text-sm font-semibold text-text-primary">Sport</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {SPORT_TILES.map((s) => {
                const selected = sport === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSport(s.id);
                      setIgnoreConflict(false);
                    }}
                    className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                      selected
                        ? 'border-brand bg-brand-light'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/80'
                    }`}
                  >
                    <span className="text-3xl">{s.emoji}</span>
                    <p className="mt-2 font-semibold text-text-primary">{s.label}</p>
                    {selected ? (
                      <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                        {venue.name}
                        <br />
                        {venue.address}
                        <br />
                        <span className="mt-1 block font-medium text-text-primary">
                          {venue.hoursLine}
                        </span>
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          {sport === 'Frisbee' ? (
            <section className="space-y-3">
              <p className="text-sm font-semibold text-text-primary">Frisbee field</p>
              <p className="text-xs text-text-secondary">
                Deering is open anytime. Hutchinson follows the weekday/weekend windows
                below.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setFrisbeeField('deering');
                    setIgnoreConflict(false);
                  }}
                  className={`rounded-2xl border-2 p-4 text-left text-sm transition-colors ${
                    frisbeeField === 'deering'
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-text-primary">{DEERING_MEADOW.name}</p>
                  <p className="mt-1 text-text-secondary">{DEERING_MEADOW.hoursLine}</p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFrisbeeField('hutchinson');
                    setIgnoreConflict(false);
                  }}
                  className={`rounded-2xl border-2 p-4 text-left text-sm transition-colors ${
                    frisbeeField === 'hutchinson'
                      ? 'border-brand bg-brand-light'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold text-text-primary">
                    {HUTCHINSON_FIELD.name}
                  </p>
                  <p className="mt-1 text-text-secondary">{HUTCHINSON_FIELD.hoursLine}</p>
                </button>
              </div>
            </section>
          ) : null}

          <section className="space-y-2">
            <label
              htmlFor="game-title"
              className="text-sm font-semibold text-text-primary"
            >
              Game title
            </label>
            <input
              id="game-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunset 5v5 pickup"
              className="app-input"
              required
            />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <label
                htmlFor="game-date"
                className="text-sm font-semibold text-text-primary"
              >
                Date
              </label>
              <input
                id="game-date"
                type="date"
                min={todayIso}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setIgnoreConflict(false);
                }}
                className="app-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="start-time"
                className="text-sm font-semibold text-text-primary"
              >
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setIgnoreConflict(false);
                }}
                className="app-input"
                required
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="end-time"
                className="text-sm font-semibold text-text-primary"
              >
                End time
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="app-input"
                required
              />
            </div>
          </section>

          {date && time && !fiveHoursLeadOk ? (
            <p className="text-sm font-medium text-amber-800">
              Start must be at least 5 hours from now — pick a later date or time.
            </p>
          ) : null}

          {time && endTime && !durationOk ? (
            <p className="text-sm font-medium text-amber-800">
              End time must be at least 40 minutes after start time.
            </p>
          ) : null}

          {isHutchinson && date && time && endTime && !hutchinsonOk ? (
            <p className="text-sm font-medium text-amber-800">
              <span className="font-semibold text-text-primary">
                Hutchinson Field hours:{' '}
              </span>
              {HUTCHINSON_FIELD.hoursLine}. Your start and end time must fall entirely
              inside that window.
            </p>
          ) : null}

          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary">Min players</p>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-2 py-2">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-text-primary"
                  onClick={() => setMinPlayers((n) => Math.max(0, n - 1))}
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="text-xl font-bold text-text-primary">{minPlayers}</span>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-text-primary"
                  onClick={() => setMinPlayers((n) => Math.min(maxPlayers, n + 1))}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-text-primary">Max players</p>
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-2 py-2">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-text-primary"
                  onClick={() => setMaxPlayers((n) => Math.max(minPlayers, n - 1))}
                >
                  <Minus className="h-5 w-5" />
                </button>
                <span className="text-xl font-bold text-text-primary">{maxPlayers}</span>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-text-primary"
                  onClick={() => setMaxPlayers((n) => Math.min(30, n + 1))}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Competitive level</p>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setCompetitiveLevel(level)}
                  className={`rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    competitiveLevel === level
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Gender</p>
            <p className="text-xs text-text-secondary">
              Who this pickup is intended for — be clear so the right people show up.
            </p>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    gender === g
                      ? 'bg-white text-brand shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <label htmlFor="notes" className="text-sm font-semibold text-text-primary">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cleats, bring both jersey colors, etc."
              rows={4}
              className="app-input min-h-[120px] resize-y"
            />
          </section>

          <div className="rounded-lg border-l-4 border-brand bg-brand-light p-4 text-sm text-text-primary">
            📌 You are responsible for reserving this court before posting this game.
          </div>

          {showConflict && conflictingGame ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">
                ⚠️ A game is already scheduled at this time — want to join it instead?
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryButton
                  type="button"
                  className="min-h-[44px] sm:w-auto"
                  onClick={() => navigate(`/games/${conflictingGame.id}`)}
                >
                  View & Join Game
                </PrimaryButton>
                <button
                  type="button"
                  className="text-sm font-medium text-text-muted underline-offset-2 hover:text-text-primary hover:underline"
                  onClick={() => setIgnoreConflict(true)}
                >
                  Post Anyway
                </button>
              </div>
            </div>
          ) : null}

          <PrimaryButton
            type="submit"
            disabled={!formComplete || showConflict}
            className="min-h-[48px] w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            Post Game
          </PrimaryButton>
        </form>
      </div>
    </div>
  );
}
