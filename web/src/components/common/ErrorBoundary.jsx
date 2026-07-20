/**
 * @file ErrorBoundary.jsx
 * @description React Error Boundary components for TradeMind UI.
 *
 * Provides:
 *  - ErrorBoundary: Top-level error boundary that reports crashes to Sentry
 *    and renders a full-page fallback UI ("Something went wrong, please refresh").
 *  - FeatureErrorBoundary: Per-route error boundary that isolates component/feature
 *    crashes so the AppShell (Sidebar/Navigation) remains interactive.
 */

import React from 'react';
import * as Sentry from '@sentry/react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error captured by ErrorBoundary:', error, errorInfo);
    try {
      Sentry.captureException(error, { extra: errorInfo });
    } catch (sentryErr) {
      console.error('Failed to report error to Sentry:', sentryErr);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1117] p-6 text-center">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl p-8 shadow-xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Something went wrong, please refresh to continue.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Per-feature route Error Boundary.
 * Isolates route component failures so that AppShell navigation/sidebar stays functional.
 */
export function FeatureErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="max-w-md w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-2xl p-6 shadow-md">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Section Error
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              An error occurred while rendering this section. You can refresh or try reloading this feature.
            </p>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
