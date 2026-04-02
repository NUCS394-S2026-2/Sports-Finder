import { ArrowLeft, Calendar, Clock, MapPin, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { useGames } from '../context/games-context';

const sports = [
  { id: 'Basketball', icon: '🏀' },
  { id: 'Soccer', icon: '⚽' },
  { id: 'Tennis', icon: '🎾' },
  { id: 'Volleyball', icon: '🏐' },
  { id: 'Skateboarding', icon: '🛹' },
  { id: 'Cycling', icon: '🚴' },
  { id: 'Running', icon: '🏃' },
  { id: 'Swimming', icon: '🏊' },
];

const competitiveLevels = ['Casual', 'Intermediate', 'Pro'] as const;

export function AddGamePage() {
  const navigate = useNavigate();
  const { addGame } = useGames();

  const [selectedSport, setSelectedSport] = useState('Basketball');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [competitiveLevel, setCompetitiveLevel] = useState<
    'Casual' | 'Intermediate' | 'Pro'
  >('Casual');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !location || !date || !time) {
      toast.error('Please fill in all required fields');
      return;
    }

    addGame({
      sport: selectedSport,
      title,
      location,
      date,
      time,
      maxPlayers,
      competitiveLevel,
      notes: notes || undefined,
    });

    toast.success('Game created successfully!');
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button & Title - Mobile Only */}
      <div className="flex items-center gap-4 mb-8 lg:hidden">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-primary hover:bg-[#2c2c2c] transition-colors active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-['Epilogue'] text-3xl font-extrabold tracking-tight uppercase text-foreground">
          Host a Game
        </h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block mb-8">
        <p className="text-muted-foreground">
          Create a new game and invite others to join
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Sport Selection */}
            <section className="space-y-4">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Select Sport
              </p>
              <div className="grid grid-cols-4 gap-3">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => setSelectedSport(sport.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl gap-2 transition-all ${
                      selectedSport === sport.id
                        ? 'bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(255,143,111,0.15)]'
                        : 'bg-[#262626] text-muted-foreground hover:bg-[#2c2c2c]'
                    }`}
                  >
                    <span className="text-2xl">{sport.icon}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider">
                      {sport.id}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Game Title */}
            <section className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Game Title
              </p>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset 3v3 Pick-up"
                className="w-full bg-[#131313] border-none rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-all"
                required
              />
            </section>

            {/* Location */}
            <section className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Location
              </p>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search court or address"
                  className="w-full bg-[#131313] border-none rounded-xl py-4 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                />
              </div>
            </section>

            {/* Date & Time */}
            <section className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                  Date
                </p>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#131313] border-none rounded-xl py-4 pl-12 pr-4 text-foreground focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                  Time
                </p>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#131313] border-none rounded-xl py-4 pl-12 pr-4 text-foreground focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Max Players */}
            <section className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Max Players
              </p>
              <div className="flex items-center justify-between bg-[#131313] rounded-xl p-2">
                <button
                  type="button"
                  onClick={() => setMaxPlayers(Math.max(2, maxPlayers - 1))}
                  className="w-12 h-12 flex items-center justify-center bg-[#262626] rounded-lg text-foreground active:scale-95 transition-all hover:bg-[#2c2c2c]"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-3xl font-['Epilogue'] font-bold text-primary">
                  {maxPlayers}
                </span>
                <button
                  type="button"
                  onClick={() => setMaxPlayers(Math.min(50, maxPlayers + 1))}
                  className="w-12 h-12 flex items-center justify-center bg-[#262626] rounded-lg text-foreground active:scale-95 transition-all hover:bg-[#2c2c2c]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </section>

            {/* Competitive Level */}
            <section className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Competitive Level
              </p>
              <div className="flex bg-[#131313] p-1 rounded-xl">
                {competitiveLevels.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setCompetitiveLevel(level)}
                    className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-all ${
                      competitiveLevel === level
                        ? 'bg-[#262626] text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </section>

            {/* Notes */}
            <section className="space-y-3">
              <p className="text-xs tracking-widest text-muted-foreground uppercase font-semibold">
                Notes/Requirements
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bring water, sneakers required..."
                rows={5}
                className="w-full bg-[#131313] border-none rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 transition-all resize-none"
              />
            </section>

            {/* Preview Card - Desktop Only */}
            <div className="hidden lg:block bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-2xl border border-primary/20">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-widest font-semibold">
                Preview
              </p>
              <div className="space-y-2">
                <p className="font-['Epilogue'] text-lg font-bold text-foreground">
                  {title || 'Your Game Title'}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xl">
                    {sports.find((s) => s.id === selectedSport)?.icon}
                  </span>
                  <span>{selectedSport}</span>
                  <span>•</span>
                  <span>{competitiveLevel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="lg:max-w-md lg:mx-auto">
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-['Epilogue'] font-extrabold text-xl tracking-tight shadow-[0_12px_24px_rgba(255,143,111,0.2)] hover:shadow-[0_16px_32px_rgba(255,143,111,0.3)] active:scale-[0.98] transition-all"
          >
            POST GAME
          </button>
        </div>
      </form>
    </div>
  );
}
