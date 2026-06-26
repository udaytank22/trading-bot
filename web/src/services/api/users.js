import { createResourceApi } from './factory';

const api = createResourceApi('/users');

export const getUsers = api.getAll;
export const getUser = api.getById;
export const createUser = api.create;
export const updateUser = api.update;
export const deleteUser = api.remove;
