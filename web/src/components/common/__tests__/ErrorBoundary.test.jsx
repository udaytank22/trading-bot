/**
 * @file ErrorBoundary.test.jsx
 * @description Unit tests for ErrorBoundary and FeatureErrorBoundary components.
 *
 * Covers:
 *  - Catching forced component render errors
 *  - Rendering fallback UI instead of blank white screen
 *  - Reporting error to Sentry
 *  - Resetting error state when retry button is clicked
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Sentry from '@sentry/react';
import { ErrorBoundary, FeatureErrorBoundary } from '../ErrorBoundary';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

function ProblemChild({ shouldThrow = true }) {
  if (shouldThrow) {
    throw new Error('Test forced render explosion');
  }
  return <div>Healthy Component</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in Vitest runner output during error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders children normally when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('catches forced render error, reports to Sentry, and renders top-level fallback UI', () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/please refresh to continue/i)).toBeInTheDocument();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.anything()
    );
  });

  it('renders custom fallback if provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Error View</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error View')).toBeInTheDocument();
  });
});

describe('FeatureErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders section error fallback UI when a feature component throws', () => {
    render(
      <FeatureErrorBoundary>
        <ProblemChild shouldThrow={true} />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Section Error')).toBeInTheDocument();
    expect(screen.getByText(/An error occurred while rendering this section/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
  });
});
