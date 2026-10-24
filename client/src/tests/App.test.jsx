import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../app/App';

describe('Smart Task Platform App Shell', () => {
  it('renders the brand title and core navigation', () => {
    render(<App />);

    // Brand and logo check
    expect(screen.getByText('SmartTask')).toBeInTheDocument();

    // Core navigation items check
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('AI Planner')).toBeInTheDocument();
  });

  it('renders the dashboard welcome card with operational indicator', () => {
    render(<App />);

    expect(screen.getByText(/Welcome to Smart Task Platform/i)).toBeInTheDocument();
    expect(screen.getByText(/Smart Task Platform Operational/i)).toBeInTheDocument();
  });
});
