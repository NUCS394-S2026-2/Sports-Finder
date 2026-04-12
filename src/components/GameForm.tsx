import { type FormEvent, useState } from 'react';

import { ageRanges, genders, skillLevels } from '../data';
import type { GameDraft, PickupGame, SportName } from '../types';

type GameFormProps = {
  draft: GameDraft;
  games: PickupGame[];
  onChange: (nextDraft: GameDraft) => void;
  onSubmit: () => void;
  onClose: () => void;
  onViewGame: (gameId: string) => void;
};

type Notification = {
  type: 'error' | 'warning';
  message: string;
  action?: { label: string; onClick: () => void };
};

const VANDY_TENNIS_COURTS = 'Vandy (Northwestern Tennis Courts)';
const DEERING_MEADOW = 'Deering Meadow';
const HUDSON_FIELD = 'Hudson Field';

export function GameForm({
  draft,
  games,
  onChange,
  onSubmit,
  onClose,
  onViewGame,
}: GameFormProps) {
  const [revealedStep, setRevealedStep] = useState(1);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  function generateTimeSlots() {
    const datePart = draft.startTime.split('T')[0] || '';
    const isHudsonSelection =
      draft.sport === 'Soccer' ||
      (draft.sport === 'Ultimate Frisbee' && draft.location === HUDSON_FIELD);

    let startMinute = 0;
    let endMinute = 23 * 60 + 45;

    if (isHudsonSelection && datePart) {
      const selectedDate = new Date(`${datePart}T00:00:00`);
      const dayOfWeek = selectedDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      startMinute = isWeekend ? 8 * 60 : 18 * 60;
      endMinute = isWeekend ? 21 * 60 : 22 * 60;
    }

    const slots: string[] = [];
    for (let minuteValue = startMinute; minuteValue <= endMinute; minuteValue += 15) {
      const hour = String(Math.floor(minuteValue / 60)).padStart(2, '0');
      const minute = String(minuteValue % 60).padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }

    return slots;
  }

  function getHudsonDefaultTimeForDate(datePart: string): string {
    if (!datePart) {
      return '18:00';
    }

    const selectedDate = new Date(`${datePart}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return isWeekend ? '08:00' : '18:00';
  }

  function getNormalizedDraftForAvailability(nextDraft: GameDraft): GameDraft {
    const [datePart, timePart] = nextDraft.startTime.split('T');
    if (!datePart) {
      return nextDraft;
    }

    const requiresHudsonWindow =
      nextDraft.sport === 'Soccer' ||
      (nextDraft.sport === 'Ultimate Frisbee' && nextDraft.location === HUDSON_FIELD);

    if (!requiresHudsonWindow) {
      return nextDraft;
    }

    if (!timePart || !isHudsonTimeAllowed(nextDraft.startTime)) {
      return {
        ...nextDraft,
        startTime: `${datePart}T${getHudsonDefaultTimeForDate(datePart)}`,
      };
    }

    return nextDraft;
  }

  function isHudsonTimeAllowed(startTime: string): boolean {
    if (!startTime.includes('T')) {
      return true;
    }

    const [datePart, timePart] = startTime.split('T');
    if (!datePart || !timePart) {
      return true;
    }

    const [hour, minute] = timePart.split(':').map(Number);
    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return true;
    }

    const totalMinutes = hour * 60 + minute;
    const selectedDate = new Date(`${datePart}T00:00:00`);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const startMinute = isWeekend ? 8 * 60 : 18 * 60;
    const endMinute = isWeekend ? 21 * 60 : 22 * 60;
    return totalMinutes >= startMinute && totalMinutes <= endMinute;
  }

  function getAvailabilityError(nextDraft: GameDraft): string | null {
    if (!nextDraft.startTime.includes('T')) {
      return null;
    }

    if (nextDraft.sport === 'Tennis') {
      return null;
    }

    if (nextDraft.sport === 'Soccer') {
      if (!isHudsonTimeAllowed(nextDraft.startTime)) {
        return 'Hudson Field is available 6:00pm-10:00pm on weekdays and 8:00am-9:00pm on weekends.';
      }
      return null;
    }

    if (nextDraft.sport === 'Ultimate Frisbee' && nextDraft.location === HUDSON_FIELD) {
      if (!isHudsonTimeAllowed(nextDraft.startTime)) {
        return 'Hudson Field is available 6:00pm-10:00pm on weekdays and 8:00am-9:00pm on weekends.';
      }
    }

    return null;
  }

  function formatISODate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseISODate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function getCalendarCells(monthDate: Date): Array<number | null> {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<number | null> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(day);
    }
    return cells;
  }

  function handleCalendarDateSelect(day: number) {
    const pickedDate = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day,
    );
    const date = formatISODate(pickedDate);
    const time = draft.startTime.split('T')[1] || '08:00';

    const nextDraft = getNormalizedDraftForAvailability({
      ...draft,
      startTime: `${date}T${time}`,
    });

    onChange(nextDraft);
    setNotification(null);
    setConflictNotification(findConflictForDraft(nextDraft));
  }

  function getLocationOptions(sport: SportName | ''): string[] {
    switch (sport) {
      case 'Tennis':
        return [VANDY_TENNIS_COURTS];
      case 'Soccer':
        return [HUDSON_FIELD];
      case 'Ultimate Frisbee':
        return [DEERING_MEADOW, HUDSON_FIELD];
      default:
        return [];
    }
  }

  function isTennisDateValid(dateString: string): boolean {
    if (!dateString) return true;
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    return month >= 3 && month <= 10;
  }

  function formatDateForComparison(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  }

  function findConflict(): PickupGame | null {
    if (!draft.startTime.includes('T')) {
      return null;
    }

    const selectedDate = formatDateForComparison(draft.startTime);
    const selectedTime = draft.startTime.slice(11, 16);

    if (!selectedDate || !selectedTime) {
      return null;
    }

    return (
      games.find((game) => {
        const gameDate = formatDateForComparison(game.startTime);
        const gameTime = game.startTime.slice(11, 16);

        if (!gameDate || !gameTime) {
          return false;
        }

        return (
          game.sport === draft.sport &&
          gameDate === selectedDate &&
          gameTime === selectedTime &&
          game.spotsFilled < game.capacity
        );
      }) || null
    );
  }

  function findConflictForDraft(nextDraft: GameDraft): PickupGame | null {
    if (!nextDraft.startTime.includes('T')) {
      return null;
    }

    const selectedDate = formatDateForComparison(nextDraft.startTime);
    const selectedTime = nextDraft.startTime.slice(11, 16);

    if (!selectedDate || !selectedTime) {
      return null;
    }

    return (
      games.find((game) => {
        const gameDate = formatDateForComparison(game.startTime);
        const gameTime = game.startTime.slice(11, 16);

        if (!gameDate || !gameTime) {
          return false;
        }

        return (
          game.sport === nextDraft.sport &&
          gameDate === selectedDate &&
          gameTime === selectedTime &&
          game.spotsFilled < game.capacity
        );
      }) || null
    );
  }

  function setConflictNotification(conflict: PickupGame | null) {
    if (!conflict) {
      setNotification((current) => (current?.type === 'warning' ? null : current));
      return;
    }

    setNotification({
      type: 'warning',
      message: `There is already a ${conflict.sport} game at this date and time with open spots.`,
      action: {
        label: 'View game',
        onClick: () => {
          onViewGame(conflict.id);
        },
      },
    });
  }

  function handleSportSelect(sport: SportName) {
    const options = getLocationOptions(sport);
    const nextDraft: GameDraft = getNormalizedDraftForAvailability({
      ...draft,
      sport,
      location:
        sport === 'Tennis'
          ? options[0] || ''
          : options.includes(draft.location)
            ? draft.location
            : options[0] || '',
    });

    onChange(nextDraft);
    setNotification(null);
    setRevealedStep((current) => Math.max(current, 2));
    setConflictNotification(findConflictForDraft(nextDraft));
  }

  function handleDateContinue() {
    const selectedDate = draft.startTime.split('T')[0];

    if (!selectedDate) {
      setNotification({
        type: 'error',
        message: 'Please pick a date before continuing.',
      });
      return;
    }

    if (draft.sport === 'Tennis' && !isTennisDateValid(draft.startTime)) {
      setNotification({
        type: 'error',
        message: 'Tennis games can only be scheduled between March and October.',
      });
      return;
    }

    setNotification(null);
    setRevealedStep((current) => Math.max(current, 3));

    setConflictNotification(findConflict());
  }

  function handleTimeContinue() {
    const selectedTime = draft.startTime.split('T')[1];
    const availableSlots = generateTimeSlots();

    if (!selectedTime) {
      setNotification({
        type: 'error',
        message: 'Please pick a time before continuing.',
      });
      return;
    }

    if (!availableSlots.includes(selectedTime)) {
      setNotification({
        type: 'error',
        message: 'Please choose a valid time from the list for this field.',
      });
      return;
    }

    const availabilityError = getAvailabilityError(draft);
    if (availabilityError) {
      setNotification({
        type: 'error',
        message: availabilityError,
      });
      return;
    }

    setNotification(null);
    setRevealedStep((current) => Math.max(current, 4));
    setConflictNotification(findConflict());
  }

  function handleLocationContinue() {
    if (draft.sport !== 'Tennis' && !draft.location.trim()) {
      setNotification({
        type: 'error',
        message: 'Please choose a location before continuing.',
      });
      return;
    }

    const availabilityError = getAvailabilityError(draft);
    if (availabilityError) {
      setNotification({
        type: 'error',
        message: availabilityError,
      });
      return;
    }

    setNotification(null);
    setRevealedStep((current) => Math.max(current, 5));
  }

  function handleContinue() {
    if (revealedStep === 1 && !draft.sport) {
      setNotification({
        type: 'error',
        message: 'Please select a sport before continuing.',
      });
      return;
    }

    if (revealedStep >= 3) {
      const conflict = findConflict();
      if (conflict) {
        setNotification({
          type: 'error',
          message:
            'This date and time already has an open game for this sport. Please change sport, date, or time to continue.',
          action: {
            label: 'View game',
            onClick: () => {
              onViewGame(conflict.id);
            },
          },
        });
        return;
      }
    }

    if (revealedStep === 1) {
      setRevealedStep(2);
      return;
    }

    if (revealedStep === 2) {
      handleDateContinue();
      return;
    }

    if (revealedStep === 3) {
      handleTimeContinue();
      return;
    }

    if (revealedStep === 4) {
      handleLocationContinue();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const availabilityError = getAvailabilityError(draft);
    if (availabilityError) {
      setNotification({
        type: 'error',
        message: availabilityError,
      });
      return;
    }

    if (draft.capacity === '') {
      setNotification({
        type: 'error',
        message: 'Please enter a capacity before publishing.',
      });
      return;
    }

    if (draft.capacity > 30) {
      setNotification({
        type: 'error',
        message: 'Capacity cannot be greater than 30.',
      });
      return;
    }

    if (draft.capacity < 2) {
      setNotification({
        type: 'error',
        message: 'Capacity must be at least 2.',
      });
      return;
    }

    const conflict = findConflict();
    if (conflict) {
      setNotification({
        type: 'error',
        message: `A ${conflict.sport} game already exists at this time with open spots.`,
        action: {
          label: 'View game',
          onClick: () => {
            onViewGame(conflict.id);
          },
        },
      });
      return;
    }

    onSubmit();
  }

  const timeSlots = generateTimeSlots();
  const selectedDate = draft.startTime.split('T')[0] || '';
  const selectedTime = draft.startTime.split('T')[1] || '08:00';
  const locationOptions = getLocationOptions(draft.sport);
  const calendarCells = getCalendarCells(calendarMonth);
  const selectedDateAsDate = parseISODate(selectedDate);
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
        <div className="form-step">
          <div>
            <h3>What sport?</h3>
          </div>
          <div className="sport-options">
            {(['Tennis', 'Soccer', 'Ultimate Frisbee'] as SportName[]).map((sport) => (
              <button
                key={sport}
                type="button"
                onClick={() => handleSportSelect(sport)}
                className="sport-option-button"
                aria-pressed={draft.sport === sport}
              >
                {sport}
              </button>
            ))}
          </div>
        </div>

        {revealedStep >= 2 ? (
          <div className="form-step">
            <div>
              <h3>When? (Date)</h3>
              <div className="calendar-picker" role="group" aria-label="Date picker">
                <div className="calendar-header">
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={() =>
                      setCalendarMonth(
                        (current) =>
                          new Date(current.getFullYear(), current.getMonth() - 1, 1),
                      )
                    }
                    aria-label="Previous month"
                  >
                    Prev
                  </button>
                  <p>
                    {calendarMonth.toLocaleString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  <button
                    type="button"
                    className="calendar-nav"
                    onClick={() =>
                      setCalendarMonth(
                        (current) =>
                          new Date(current.getFullYear(), current.getMonth() + 1, 1),
                      )
                    }
                    aria-label="Next month"
                  >
                    Next
                  </button>
                </div>

                <div className="calendar-weekdays">
                  {weekdayLabels.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarCells.map((day, index) => {
                    if (day === null) {
                      return <span key={`blank-${index}`} className="calendar-empty" />;
                    }

                    const date = new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      day,
                    );
                    const isSelected =
                      selectedDateAsDate !== null &&
                      selectedDateAsDate.getFullYear() === date.getFullYear() &&
                      selectedDateAsDate.getMonth() === date.getMonth() &&
                      selectedDateAsDate.getDate() === date.getDate();

                    return (
                      <button
                        key={formatISODate(date)}
                        type="button"
                        className={`calendar-day${isSelected ? ' calendar-day-selected' : ''}`}
                        onClick={() => handleCalendarDateSelect(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <p className="calendar-selected-date">
                  {selectedDate
                    ? `Selected date: ${selectedDateAsDate?.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}`
                    : 'Select a date from the calendar'}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {revealedStep >= 3 ? (
          <div className="form-step">
            <label>
              <h3>When? (Time)</h3>
              <select
                value={selectedTime}
                onChange={(event) => {
                  const nextDraft = getNormalizedDraftForAvailability({
                    ...draft,
                    startTime: `${selectedDate}T${event.target.value}`,
                  });

                  const availabilityError = getAvailabilityError(nextDraft);

                  onChange(nextDraft);
                  if (availabilityError) {
                    setNotification({
                      type: 'error',
                      message: availabilityError,
                    });
                  } else {
                    setNotification(null);
                  }
                  setConflictNotification(findConflictForDraft(nextDraft));
                }}
              >
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {revealedStep >= 4 ? (
          <div className="form-step">
            <label>
              <h3>Where?</h3>
              {draft.sport === 'Tennis' ? (
                <p className="location-static">{VANDY_TENNIS_COURTS}</p>
              ) : (
                <select
                  value={draft.location}
                  onChange={(event) => {
                    const nextDraft = getNormalizedDraftForAvailability({
                      ...draft,
                      location: event.target.value,
                    });
                    const availabilityError = getAvailabilityError(nextDraft);

                    onChange(nextDraft);
                    if (availabilityError) {
                      setNotification({
                        type: 'error',
                        message: availabilityError,
                      });
                    } else {
                      setNotification(null);
                      setConflictNotification(findConflictForDraft(nextDraft));
                    }
                  }}
                >
                  {locationOptions.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>
        ) : null}

        {revealedStep >= 5 ? (
          <>
            <h3>Game Details</h3>

            <label>
              Capacity
              <input
                type="number"
                min={2}
                max={30}
                value={draft.capacity}
                onChange={(event) => {
                  const value = event.target.value;
                  onChange({
                    ...draft,
                    capacity: value === '' ? '' : Number(value),
                  });
                }}
                required
              />
            </label>

            <label>
              Organizer
              <input
                value={draft.organizer}
                onChange={(event) =>
                  onChange({ ...draft, organizer: event.target.value })
                }
                placeholder="Your name"
                required
              />
            </label>

            <label>
              Skill level
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
              Age range
              <select
                value={draft.ageRange}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    ageRange: event.target.value as GameDraft['ageRange'],
                  })
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
                  onChange({
                    ...draft,
                    gender: event.target.value as GameDraft['gender'],
                  })
                }
              >
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                value={draft.note}
                onChange={(event) => onChange({ ...draft, note: event.target.value })}
                placeholder="What to bring, game format, etc..."
                rows={4}
              />
            </label>
          </>
        ) : null}

        {notification && (
          <div className={`notification notification-${notification.type}`}>
            <p>{notification.message}</p>
            {notification.action && (
              <button
                type="button"
                onClick={notification.action.onClick}
                className="notification-action"
              >
                {notification.action.label}
              </button>
            )}
          </div>
        )}

        {revealedStep < 5 ? (
          <div className="form-actions">
            <button type="button" onClick={handleContinue} className="primary-button">
              Continue
            </button>
          </div>
        ) : null}

        {revealedStep >= 5 ? (
          <div className="form-actions">
            <button className="primary-button" type="submit">
              Publish game
            </button>
          </div>
        ) : null}
      </form>
    </section>
  );
}
