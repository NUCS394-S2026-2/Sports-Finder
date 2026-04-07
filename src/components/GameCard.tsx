import type { KeyboardEvent } from 'react';

import { formatGameTime } from '../lib/datetime';
import type { PickupGame } from '../types';

type GameCardProps = {
  game: PickupGame;
  onJoin: (id: string) => void;
  onOpen?: (game: PickupGame) => void;
  cardId?: string;
  highlighted?: boolean;
  canSeePrivateDetails?: boolean;
  canJoin?: boolean;
};

export function GameCard({
  game,
  onJoin,
  onOpen,
  cardId,
  highlighted = false,
  canSeePrivateDetails = true,
  canJoin = true,
}: GameCardProps) {
  const spotsRemaining = game.capacity - game.spotsFilled;
  const isFull = spotsRemaining <= 0;
  const clickableProps = onOpen
    ? {
        onClick: () => onOpen(game),
        onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(game);
          }
        },
        role: 'button' as const,
        tabIndex: 0,
      }
    : {};

  return (
    <article
      id={cardId}
      className={`game-card${onOpen ? ' game-card-clickable' : ''}${highlighted ? ' game-card-highlighted' : ''}`}
      {...clickableProps}
    >
      <div className="game-card-top">
        <span className="sport-pill">{game.sport}</span>
        <span className={isFull ? 'status status-full' : 'status'}>
          {isFull ? 'Full' : `${spotsRemaining} spots open`}
        </span>
      </div>

      <h3>{canSeePrivateDetails ? game.location : 'Login to view location'}</h3>
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
          <dd>{canSeePrivateDetails ? game.organizer : 'Login required'}</dd>
        </div>
        <div>
          <dt>Players</dt>
          <dd>
            {game.spotsFilled}/{game.capacity}
          </dd>
        </div>
      </dl>

      {canSeePrivateDetails ? (
        <div className="attendees-list">
          <p className="attendees-title">Attendees</p>
          <p>
            {game.attendees.length > 0 ? game.attendees.join(', ') : 'No attendees yet.'}
          </p>
        </div>
      ) : null}

      <button
        type="button"
        className="join-button"
        disabled={isFull || !canJoin}
        onClick={(event) => {
          event.stopPropagation();
          onJoin(game.id);
        }}
      >
        {isFull ? 'Game full' : canJoin ? 'Join game' : 'Login to join'}
      </button>
    </article>
  );
}
