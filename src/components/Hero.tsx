type HeroProps = {
  onCreateGame: () => void;
  totalGames: number;
  openSpots: number;
  sportsCount: number;
};

export function Hero({ onCreateGame, totalGames, openSpots, sportsCount }: HeroProps) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Pickup Sports Finder</p>
        <h1>Find a game, fill a roster, and play tonight.</h1>
        <p className="hero-text">
          Browse live pickup games near you, join the right fit, or post a new run in
          seconds. Everything stays in memory for a fast prototype.
        </p>

        <div className="hero-actions">
          <button className="primary-button" onClick={onCreateGame} type="button">
            Create a game
          </button>
          <a className="secondary-button" href="#games">
            View games
          </a>
        </div>
      </div>

      <div className="hero-metrics" aria-label="App summary">
        <div>
          <span>{totalGames}</span>
          <p>active games</p>
        </div>
        <div>
          <span>{openSpots}</span>
          <p>spots open</p>
        </div>
        <div>
          <span>{sportsCount}</span>
          <p>sports supported</p>
        </div>
      </div>
    </section>
  );
}
