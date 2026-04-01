import { FormEvent, useMemo, useState } from 'react';

type EventItem = {
  id: number;
  sport: string;
  location: string;
  date: string;
  skillLevel: string;
  spotsTotal: number;
  spotsLeft: number;
  host: string;
};

const initialEvents: EventItem[] = [
  {
    id: 1,
    sport: 'Soccer',
    location: 'Norris Lawn',
    date: '2026-04-03T18:00',
    skillLevel: 'All Levels',
    spotsTotal: 14,
    spotsLeft: 6,
    host: 'Maya',
  },
  {
    id: 2,
    sport: 'Basketball',
    location: 'Blomquist Gym',
    date: '2026-04-04T16:30',
    skillLevel: 'Beginner',
    spotsTotal: 10,
    spotsLeft: 3,
    host: 'Jordan',
  },
  {
    id: 3,
    sport: 'Volleyball',
    location: 'Lakefill Courts',
    date: '2026-04-05T17:30',
    skillLevel: 'Intermediate',
    spotsTotal: 12,
    spotsLeft: 8,
    host: 'Avery',
  },
];

type FormState = {
  sport: string;
  location: string;
  date: string;
  skillLevel: string;
  spotsTotal: number;
  host: string;
};

const emptyForm: FormState = {
  sport: '',
  location: '',
  date: '',
  skillLevel: 'All Levels',
  spotsTotal: 10,
  host: '',
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function App() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [joinedEventIds, setJoinedEventIds] = useState<number[]>([]);
  const [error, setError] = useState('');

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return events;

    return events.filter((event) => {
      return (
        event.sport.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.skillLevel.toLowerCase().includes(query)
      );
    });
  }, [events, search]);

  function handleCreateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !form.sport.trim() ||
      !form.location.trim() ||
      !form.date.trim() ||
      !form.host.trim()
    ) {
      setError('Please fill in all fields before posting an event.');
      return;
    }

    if (form.spotsTotal < 2) {
      setError('Please choose at least 2 total spots.');
      return;
    }

    const newEvent: EventItem = {
      id: Date.now(),
      sport: form.sport.trim(),
      location: form.location.trim(),
      date: form.date,
      skillLevel: form.skillLevel,
      spotsTotal: form.spotsTotal,
      spotsLeft: form.spotsTotal,
      host: form.host.trim(),
    };

    setEvents((prev) =>
      [newEvent, ...prev].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    );
    setForm(emptyForm);
    setError('');
  }

  function handleJoin(eventId: number) {
    const target = events.find((event) => event.id === eventId);
    if (!target || target.spotsLeft === 0 || joinedEventIds.includes(eventId)) {
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId ? { ...event, spotsLeft: event.spotsLeft - 1 } : event,
      ),
    );

    setJoinedEventIds((prev) => [...prev, eventId]);
  }

  function handleLeave(eventId: number) {
    const target = events.find((event) => event.id === eventId);
    if (!target || !joinedEventIds.includes(eventId)) {
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId && event.spotsLeft < event.spotsTotal
          ? { ...event, spotsLeft: event.spotsLeft + 1 }
          : event,
      ),
    );

    setJoinedEventIds((prev) => prev.filter((id) => id !== eventId));
  }

  return (
    <main
      style={{
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '2rem 1rem 4rem',
        fontFamily: 'Arial, sans-serif',
        color: '#1f2937',
      }}
    >
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Sports Finder</h1>
        <p style={{ margin: 0, fontSize: '1rem', color: '#4b5563' }}>
          Find pickup games, post your own event, and sign up in seconds.
        </p>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '1.5rem',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '1.25rem',
            background: '#f9fafb',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Post a pickup game</h2>

          <form onSubmit={handleCreateEvent}>
            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Sport
              <input
                type="text"
                value={form.sport}
                onChange={(e) => setForm((prev) => ({ ...prev, sport: e.target.value }))}
                placeholder="e.g. Soccer"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Location
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. Campus Rec Field"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Date and time
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Skill level
              <select
                value={form.skillLevel}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, skillLevel: e.target.value }))
                }
                style={inputStyle}
              >
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '0.75rem' }}>
              Total spots
              <input
                type="number"
                min={2}
                max={50}
                value={form.spotsTotal}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    spotsTotal: Number(e.target.value),
                  }))
                }
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              Host name
              <input
                type="text"
                value={form.host}
                onChange={(e) => setForm((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="Your name"
                style={inputStyle}
              />
            </label>

            {error ? <p style={{ color: '#b91c1c', marginTop: 0 }}>{error}</p> : null}

            <button type="submit" style={primaryButtonStyle}>
              Post Event
            </button>
          </form>
        </div>

        <div>
          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <label style={{ display: 'block' }}>
              Search for sports, locations, or skill level
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try soccer, beginner, gym..."
                style={inputStyle}
              />
            </label>
          </div>

          <section aria-label="Available sports events">
            <h2 style={{ marginBottom: '1rem' }}>Available events</h2>

            {filteredEvents.length === 0 ? (
              <div
                style={{
                  border: '1px dashed #d1d5db',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  color: '#6b7280',
                }}
              >
                No events match your search.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredEvents.map((event) => {
                  const joined = joinedEventIds.includes(event.id);
                  const full = event.spotsLeft === 0;

                  return (
                    <article
                      key={event.id}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '16px',
                        padding: '1rem 1.1rem',
                        background: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          alignItems: 'start',
                        }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 0.35rem 0' }}>{event.sport}</h3>
                          <p style={metaStyle}>
                            <strong>Location:</strong> {event.location}
                          </p>
                          <p style={metaStyle}>
                            <strong>When:</strong> {formatDate(event.date)}
                          </p>
                          <p style={metaStyle}>
                            <strong>Level:</strong> {event.skillLevel}
                          </p>
                          <p style={metaStyle}>
                            <strong>Host:</strong> {event.host}
                          </p>
                          <p style={metaStyle}>
                            <strong>Spots left:</strong> {event.spotsLeft} /{' '}
                            {event.spotsTotal}
                          </p>
                        </div>

                        <div style={{ minWidth: '120px' }}>
                          {joined ? (
                            <button
                              onClick={() => handleLeave(event.id)}
                              style={secondaryButtonStyle}
                            >
                              Leave
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoin(event.id)}
                              disabled={full}
                              style={{
                                ...primaryButtonStyle,
                                width: '100%',
                                opacity: full ? 0.6 : 1,
                                cursor: full ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {full ? 'Full' : 'Join'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: '0.4rem',
  padding: '0.7rem 0.8rem',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
  fontSize: '0.95rem',
};

const primaryButtonStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #d1d5db',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
  background: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
};

const metaStyle: React.CSSProperties = {
  margin: '0 0 0.35rem 0',
  color: '#4b5563',
};
