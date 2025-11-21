import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeCard } from '../WelcomeCard';

describe('WelcomeCard', () => {
  it('renders welcome message', () => {
    render(<WelcomeCard />);
    expect(screen.getByText('Welcome to TEAMFIT!')).toBeInTheDocument();
  });

  it('shows instructions for new users', () => {
    render(<WelcomeCard />);
    expect(
      screen.getByText(/not currently assigned to any team/i)
    ).toBeInTheDocument();
  });
});
