import React from 'react';
import GameFilters from '../components/GameFilters';
import GameCard from '../components/GameCard';
import { sampleGames } from '../data/sampleGames';

const FindGames: React.FC = () => {
  return (
    <div className="find-games">
      <h1>Find Games</h1>
      <GameFilters />
      <div className="game-cards">
        {sampleGames.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};

export default FindGames;