import { createResourceApi } from './factory';

const api = createResourceApi('/documents');

export const getDocuments = api.getAll;
export const getDocument = api.getById;
export const createDocument = api.create;
export const updateDocument = api.update;
export const deleteDocument = api.remove;
