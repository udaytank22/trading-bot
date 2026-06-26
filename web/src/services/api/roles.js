import { createResourceApi } from './factory';

const api = createResourceApi('/roles');

export const getRoles = api.getAll;
export const getRole = api.getById;
export const createRole = api.create;
export const updateRole = api.update;
export const deleteRole = api.remove;
