// src/mocks/server.js
// MSW Node server — used by Vitest (Node environment via jsdom)

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
