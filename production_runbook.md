# Production Runbook: TradeMind ERP

This runbook is designed to help operators and engineers quickly diagnose and resolve production issues based on the architecture established in Phase 4.

## 1. High-Level Architecture

*   **Frontend**: React (Vite) single-page application.
*   **Backend**: Node.js/Express REST API with Socket.io for real-time events.
*   **Database**: PostgreSQL managed via Prisma ORM.
*   **Caching/Message Broker**: Redis (used for Socket.io adapter and BullMQ background jobs).

## 2. Common Scenarios & Diagnostics

### A. "The backend is crashing constantly or restarting"
*   **Check the Logs**: Since structured logging is configured via `pino-http`, filter the application logs for `level >= 50` (Error or Fatal).
*   **Probable Cause 1 (Secrets)**: We recently removed fallback defaults for critical secrets (like `JWT_SECRET` and `REFRESH_SECRET`). If these are missing from the production environment variables, the application will refuse to start or authenticate.
*   **Probable Cause 2 (Redis)**: The app uses `@socket.io/redis-adapter`. Ensure the Redis server is available on `REDIS_HOST` and `REDIS_PORT`. If it is unreachable, Socket.io initialization might fail.

### B. "Users complain that lists are slow to load"
*   **Check the Database**: We seeded large datasets to ensure list queries remain fast. Ensure that `page` and `pageSize` queries are correctly being applied in the API.
*   **Frontend Symptoms**: If the API is fast but the UI is slow or freezes, verify that list virtualization (via `@tanstack/react-virtual` or `react-window`) is still active on the `DataTable` components and hasn't been bypassed by a "view all" feature.

### C. "Some users are receiving 429 Too Many Requests errors"
*   **Check Rate Limiting Logs**: The application now has global and endpoint-specific rate limits.
*   **Resolution**: Look at the request IDs associated with the 429 errors. If it's a legitimate burst in traffic (e.g., from an integration partner), you may need to increase the limits in the API Gateway or Express rate limiter middleware. Our load tests showed the rate limits successfully block traffic exceeding 1,000 req/min.

### D. "Chat or real-time notifications are not appearing"
*   **Check Redis**: The Socket.io cluster relies on Redis to broadcast messages between different Node.js instances. If users on instance A cannot see chats from users on instance B, Redis pub/sub is likely failing.
*   **Check Client Websocket Connections**: Use browser DevTools to ensure the WebSocket connection isn't falling back to long-polling unnecessarily due to proxy misconfigurations (e.g., Nginx not upgrading the connection).

## 3. Investigating a Specific Request
Every request processed by the backend generates a unique `reqId`.
*   If a user reports an issue (e.g., "I clicked approve and got a blank screen at 2:05 PM"), ask them to check the Network tab or provide the error trace ID if surfaced in the UI.
*   Grep your centralized log aggregator for `req.id="<the_id>"`. This will trace the request completely from Express entry to database queries.

## 4. Emergency Procedures
*   **Database Rollback**: If a Prisma migration fails or causes issues, use `npx prisma migrate resolve --rolled-back ...` to recover.
*   **Clearing Queues**: If background tasks (BullMQ) are stuck, you can flush the Redis DB or use a tool like BullMQ Dashboard (if exposed internally) to clear failed jobs.
