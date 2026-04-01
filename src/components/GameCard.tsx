import { formatGameTime } from '../lib/datetime';
import type { PickupGame } from '../types';

type GameCardProps = {
  game: PickupGame;
  onJoin: (id: number) => void;
};

export function GameCard({ game, onJoin }: GameCardProps) {
  const spotsRemaining = game.capacity - game.spotsFilled;
  const isFull = spotsRemaining <= 0;

  return (
    <article className="game-card">
      <div className="game-card-top">
        <span className="sport-pill">{game.sport}</span>
        <span className={isFull ? 'status status-full' : 'status'}>
          {isFull ? 'Full' : `${spotsRemaining} spots open`}
        </span>
      </div>

      <h3>{game.location}</h3>
      <p className="game-time">{formatGameTime(game.startTime)}</p>
      <p className="game-note">{game.note}</p>

      <div className="tag-row" aria-label="Game tags">
        <span className="tag">{game.skillLevel}</span>
        <span className="tag">Age {game.ageRange}</span>
        <span className="tag">{game.gender}</span>
      </div>

      <dl className="game-details">
        <div>
          <dt>Organizer</dt>
          <dd>{game.organizer}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>
            {game.spotsFilled}/{game.capacity}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="join-button"
        disabled={isFull}
        onClick={() => onJoin(game.id)}
      >
        {isFull ? 'Game full' : 'Join game'}
      </button>
    </article>
  );
}
