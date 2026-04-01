import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

import { getNearbyGames } from '../services/gameService';
import type { Game } from '../types';

interface GameMapProps {
  onGameSelect: (game: Game) => void;
}

const NORTHWESTERN_LAT = 42.0534;
const NORTHWESTERN_LON = -87.675;

export const GameMap = ({ onGameSelect }: GameMapProps) => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState({
    lat: NORTHWESTERN_LAT,
    lon: NORTHWESTERN_LON,
  });

  useEffect(() => {
    // Fix Leaflet default marker icon issue
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Get user's geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      });
    }

    const fetchGames = async () => {
      try {
        const fetchedGames = await getNearbyGames(userLocation.lat, userLocation.lon);
        setGames(fetchedGames);
      } catch (error) {
        console.error('Failed to fetch games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading games...</div>;
  }

  return (
    <MapContainer center={[userLocation.lat, userLocation.lon]} zoom={13} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {games.map((game) => (
        <Marker key={game.id} position={[game.location.latitude, game.location.longitude]}>
          <Popup>
            <div>
              <p><strong>{game.sportType}</strong></p>
              <p>{game.location.address}</p>
              <p>{game.players.length}/{game.maxPlayers} players</p>
              <button onClick={() => onGameSelect(game)}>View Details</button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};
