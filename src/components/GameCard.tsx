import type { Game } from '../types';

interface GameCardProps {
  game: Game;
  onPlayerClick: (userId: string) => void;
  onGetDirections: () => void;
  onJoin: () => void;
}

export const GameCard = ({
  game,
  onPlayerClick,
  onGetDirections,
  onJoin,
}: GameCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{game.sportType}</h2>
        <p className="text-gray-600 text-sm">{game.description}</p>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-gray-700">
          <span className="font-semibold">Location:</span> {game.location.address}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Level:</span>{' '}
          <span className="capitalize">{game.competitiveLevel}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Players:</span> {game.players.length}/
          {game.maxPlayers}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Start Time:</span>{' '}
          {new Date(game.startTime).toLocaleString()}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Players</h3>
        <div className="space-y-1">
          {game.players.map((playerId) => (
            <button
              key={playerId}
              onClick={() => onPlayerClick(playerId)}
              className="block text-blue-600 hover:text-blue-800 text-sm"
            >
              Player: {playerId}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGetDirections}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          Get Directions
        </button>
        <button
          onClick={onJoin}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition"
        >
          Join Game
        </button>
      </div>
    </div>
  );
};
