import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StartGameForm } from '../components/StartGameForm';

describe('StartGameForm Component', () => {
  it('should render the form with all input fields', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <StartGameForm userId="user-123" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    expect(screen.getByText('Start a Game')).toBeInTheDocument();
    expect(screen.getByLabelText('Sport Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Competitive Level')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Players')).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const mockOnCancel = vi.fn();

    render(
      <StartGameForm userId="user-123" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    const submitButton = screen.getByRole('button', { name: /Create Game/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('should call onCancel when cancel button is clicked', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <StartGameForm userId="user-123" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should set default values for form fields', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <StartGameForm userId="user-123" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    const sportSelect = screen.getByLabelText('Sport Type') as HTMLSelectElement;
    const levelSelect = screen.getByLabelText('Competitive Level') as HTMLSelectElement;
    const maxPlayersInput = screen.getByLabelText('Max Players') as HTMLInputElement;

    expect(sportSelect.value).toBe('Basketball');
    expect(levelSelect.value).toBe('casual');
    expect(maxPlayersInput.value).toBe('4');
  });

  it('should update form fields when user types', () => {
    const mockOnSubmit = vi.fn();
    const mockOnCancel = vi.fn();

    render(
      <StartGameForm userId="user-123" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />,
    );

    const descriptionTextarea = screen.getByPlaceholderText(
      'Describe your game',
    ) as HTMLTextAreaElement;

    fireEvent.change(descriptionTextarea, {
      target: { value: 'Fun casual pickup game' },
    });

    expect(descriptionTextarea.value).toBe('Fun casual pickup game');
  });
});
