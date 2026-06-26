import { createResourceApi } from './factory';

const api = createResourceApi('/audit-logs');

export const getAuditLogs = api.getAll;
