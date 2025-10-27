import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from '../src/components/Dashboard';

describe('Dashboard Component', () => {
  test('renders dashboard heading', () => {
    render(<Dashboard />);
    // Adjust the text below to match your Dashboard component's heading
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});
