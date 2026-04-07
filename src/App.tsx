import './App.css';

import { useEffect, useMemo, useState } from 'react';

import { GameCard } from './components/GameCard';
import { GameForm } from './components/GameForm';
import { TagFilterGroup } from './components/TagFilterGroup';
import { Toolbar, type ViewName } from './components/Toolbar';
import { ageRanges, emptyDraft, featuredSports, genders, skillLevels } from './data';
import { toLocalDateTimeValue } from './lib/datetime';
import { createGame, fetchGames, joinGame } from './lib/games';
import type { GameDraft, PickupGame } from './types';

type TagValue<T extends string> = 'All' | T;

function App() {
  const [view, setView] = useState<ViewName>('home');
  const [games, setGames] = useState<PickupGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    skillLevel: 'All' as TagValue<PickupGame['skillLevel']>,
    ageRange: 'All' as TagValue<PickupGame['ageRange']>,
    gender: 'All' as TagValue<PickupGame['gender']>,
  });
  const [draft, setDraft] = useState<GameDraft>({
    ...emptyDraft,
    startTime: toLocalDateTimeValue(new Date(Date.now() + 90 * 60 * 1000)),
  });
  const [conflictGame, setConflictGame] = useState<PickupGame | null>(null);

  useEffect(() => {
    async function loadGames() {
      try {
        const data = await fetchGames();
        setGames(data);
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGames();
  }, []);

  const upcomingGames = useMemo(() => games.slice(0, 2), [games]);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesSkill = filters.skillLevel === 'All' || game.skillLevel === filters.skillLevel;
      const matchesAge = filters.ageRange === 'All' || game.ageRange === filters.ageRange;
      const matchesGender = filters.gender === 'All' || game.gender === filters.gender;
      return matchesSkill && matchesAge && matchesGender;
    });
  }, [filters, games]);

  // Games at risk: under 30 min away and less than half capacity filled
  const atRiskGames = useMemo(() => {
    const now = Date.now();
    return games.filter((game) => {
      const gameTime = new Date(game.startTime).getTime();
      const minutesUntil = (gameTime - now) / 60000;
      return minutesUntil <= 30 && minutesUntil > 0 && game.spotsFilled < game.capacity / 2;
    });
  }, [games]);

  async function handleJoinGame(id: string) {
    try {
      await joinGame(id);
      const updated = await fetchGames();
      setGames(updated);
    } catch (err) {
      console.error('Failed to join game:', err);
    }
  }

  async function handleCreateGame() {
    // Check for duplicate location + time (within 1 hour)
    const newTime = new Date(draft.startTime).getTime();
    const duplicate = games.find((game) => {
      const existingTime = new Date(game.startTime).getTime();
      const sameLocation = game.location === draft.location;
      const closeInTime = Math.abs(existingTime - newTime) <= 60 * 60 * 1000;
      return sameLocation && closeInTime;
    });

    if (duplicate) {
      setConflictGame(duplicate);
      return;
    }

    try {
      await createGame(draft);
      const updated = await fetchGames();
      setGames(updated);
      setDraft({
        ...emptyDraft,
        startTime: toLocalDateTimeValue(new Date(Date.now() + 120 * 60 * 1000)),
      });
      setView('find');
    } catch (err) {
      console.error('Failed to create game:', err);
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <div className="app-background" aria-hidden="true" />
        <Toolbar activeView={view} onNavigate={setView} />
        <section className="page-panel">
          <p>Loading games...</p>
        </section>
      </main>
    );
  }

  const homeSection = (
    <section className="page-panel hero-layout">
      <div className="hero-copy-card">
        <p className="eyebrow">Homepage</p>
        <h1>Find a pickup game without digging through group chats.</h1>
        <p className="hero-text">
          Play Local helps adults discover casual recreational sports nearby, join a
          roster that fits, and post a new game when the court or field needs one more player.
        </p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => setView('find')}>
            Find local games
          </button>
          <button className="secondary-button" type="button" onClick={() => setView('create')}>
            Create a game
          </button>
        </div>
      </div>

      <div className="home-upcoming">
        <div className="section-header compact">
          <div>
            <p className="eyebrow">Upcoming games</p>
            <h2>Tonight and tomorrow</h2>
          </div>
          <p className="section-copy">A couple of active games happening right now.</p>
        </div>

        {atRiskGames.length > 0 && (
          <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
            <strong>⚠️ Heads up!</strong> The following games start in under 30 minutes and may not have enough players:
            <ul style={{ margin: '8px 0 0 16px' }}>
              {atRiskGames.map((g) => (
                <li key={g.id}>{g.sport} at {g.locati
