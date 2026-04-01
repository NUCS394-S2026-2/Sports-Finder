import './styles/App.css';
import PostGameForm from './components/PostGameForm';
import GameCard from './components/GameCard';
import { useGames } from './hooks/useGames';

function App() {
  const { games } = useGames();

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏀 Pickup Sports Finder</h1>
        <p>Find and post pickup games in your city</p>
      </header>
      <main>
        <PostGameForm />
        <div className="game-list">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;