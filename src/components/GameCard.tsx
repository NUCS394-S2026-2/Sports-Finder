import React from 'react';
import { Game } from '../types/game';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <div className="game-card">
      <h3>{game.sport}</h3>
      <p>Location: {game.location}</p>
      <p>Date/Time: {new Date(game.dateTime).toLocaleString()}</p>
      <p>Organizer: {game.organizer}</p>
      <p>
        Players Joined: {game.playersJoined}/{game.maxPlayers}
      </p>
      <button className="join-button">Join</button>
    </div>
  );
};

export default GameCard;