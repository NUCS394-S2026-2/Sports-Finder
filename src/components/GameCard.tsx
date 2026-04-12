import { formatGameTime } from '../lib/datetime';
import type { PickupGame } from '../types';

type GameCardProps = {
  game: PickupGame;
  onJoin: (id: string) => void;
  isPast?: boolean;
  isJoined?: boolean;
};

export function GameCard({ game, onJoin, isPast = false, isJoined = false }: GameCardProps) {
  const spotsRemaining = game.capacity - game.players.length;
  const isFull = spotsRemaining <= 0;

  const now = new Date();
  const startTime = new Date(game.startTime);
  const minsUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60);
  const isCancelWarning = !isPast && !isFull && minsUntilStart > 0 && minsUntilStart < 30;

  const disabled = isPast || isJoined || isFull;

  let statusLabel: string;
  let statusClass: string;
  if (isPast) {
    statusLabel = 'Ended';
    statusClass = 'status status-past';
  } else if (isJoined) {
    statusLabel = 'Joined';
    statusClass = 'status status-joined';
  } else if (isFull) {
    statusLabel = 'Full';
    statusClass = 'status status-full';
  } else {
    statusLabel = `${spotsRemaining} spot${spotsRemaining === 1 ? '' : 's'} open`;
    statusClass = 'status';
  }

  const joinLabel = isPast ? 'Ended' : isJoined ? 'Joined ✓' : isFull ? 'Full' : 'Join Game';

  return (
    <article className={`game-card${isPast ? ' game-card-past' : ''}`}>
      <div className="game-card-top">
        <span className="sport-pill">{game.sport}</span>
        <span className={statusClass}>{statusLabel}</span>
      </div>

      {isCancelWarning && (
        <div className="cancel-warning">
          ⚠ Not full — may auto-cancel in {Math.round(minsUntilStart)}m
        </div>
      )}

      <h3>{game.location}</h3>
      <p className="game-time">{formatGameTime(game.startTime)}</p>
      <p className="game-note">{game.note}</p>

      <div className="tag-row" aria-label="Game tags">
        <span className="tag">{game.skillLevel}</span>
        <span className="tag">{game.ageRange}</span>
        <span className="tag">{game.gender}</span>
      </div>

      <dl className="game-details">
        <div>
          <dt>Organizer</dt>
          <dd>{game.players[0]?.name || game.organizer}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>
            {game.players.length}/{game.capacity}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className={`join-button${isJoined ? ' join-button-joined' : ''}`}
        disabled={disabled}
        onClick={() => onJoin(game.id)}
      >
        {joinLabel}
      </button>
    </article>
  );
}
