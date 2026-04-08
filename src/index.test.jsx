import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

describe('App', () => {
  it('adds two numbers and displays the result', async () => {
    render(<App />);

    const user = userEvent.setup();
    const firstInput = screen.getByLabelText(/first number/i);
    const secondInput = screen.getByLabelText(/second number/i);
    const addButton = screen.getByRole('button', { name: /add numbers/i });

    await user.clear(firstInput);
    await user.type(firstInput, '5');
    await user.clear(secondInput);
    await user.type(secondInput, '7');
    await user.click(addButton);

    expect(screen.getByText(/total/i)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('does not show a total when inputs are empty', async () => {
    render(<App />);

    const user = userEvent.setup();
    const firstInput = screen.getByLabelText(/first number/i);
    const secondInput = screen.getByLabelText(/second number/i);
    const addButton = screen.getByRole('button', { name: /add numbers/i });

    secondInput.removeAttribute('required');

    await user.clear(firstInput);
    await user.type(firstInput, '3');
    await user.click(addButton);

    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
  });
});
