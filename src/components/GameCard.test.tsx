import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { GameCard } from '../components/GameCard';
import type { Game } from '../types';

describe('GameCard Component', () => {
  const mockGame: Game = {
    id: 'game-123',
    sportType: 'Basketball',
    location: {
      latitude: 42.0534,
      longitude: -87.675,
      address: 'Northwestern gymnasium',
    },
    competitiveLevel: 'casual',
    players: ['user-1', 'user-2'],
    maxPlayers: 4,
    startTime: new Date(),
    createdBy: 'user-1',
    createdAt: new Date(),
    description: 'Fun casual pickup game',
  };

  it('should display game information', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    expect(screen.getByText('Basketball')).toBeInTheDocument();
    expect(screen.getByText('Fun casual pickup game')).toBeInTheDocument();
    expect(screen.getByText(/Northwestern gymnasium/)).toBeInTheDocument();
  });

  it('should display player count', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
  });

  it('should display competitive level', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    expect(screen.getByText(/Casual/)).toBeInTheDocument();
  });

  it('should call onGetDirections when Directions button is clicked', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    const directionsButton = screen.getByRole('button', {
      name: /Get Directions/i,
    });
    fireEvent.click(directionsButton);

    expect(mockOnGetDirections).toHaveBeenCalled();
  });

  it('should call onJoin when Join Game button is clicked', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    const joinButton = screen.getByRole('button', { name: /Join Game/i });
    fireEvent.click(joinButton);

    expect(mockOnJoin).toHaveBeenCalled();
  });

  it('should handle player name clicks', () => {
    const mockOnPlayerClick = vi.fn();
    const mockOnGetDirections = vi.fn();
    const mockOnJoin = vi.fn();

    render(
      <GameCard
        game={mockGame}
        onPlayerClick={mockOnPlayerClick}
        onGetDirections={mockOnGetDirections}
        onJoin={mockOnJoin}
      />,
    );

    const playerButtons = screen.getAllByText(/Player:/i);
    fireEvent.click(playerButtons[0]);

    expect(mockOnPlayerClick).toHaveBeenCalledWith('user-1');
  });
});
