import { createResourceApi } from './factory';

const api = createResourceApi('/permissions');

export const getPermissions = api.getAll;
