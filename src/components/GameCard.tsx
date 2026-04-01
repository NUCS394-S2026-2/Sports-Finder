import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <div className="game-card">
      <h2>{game.title}</h2>
      <p>{game.description}</p>
      <p>{game.date}</p>
      <p>{game.location}</p>
    </div>
  );
};

export default GameCard;