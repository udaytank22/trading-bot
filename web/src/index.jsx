import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './app';
import './index.css';
import Swal from 'sweetalert2';

const originalFire = Swal.fire;
Swal.fire = function (...args) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const options = args[0];
    if (options.showCancelButton) {
      options.background = '#ffffffff';
      options.color = '#000000ff';
      options.confirmButtonColor = '#000000ff';
    }
  }
  return originalFire.apply(this, args);
};

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE || 'development'
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
