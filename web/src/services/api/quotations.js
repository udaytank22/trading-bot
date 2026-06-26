import { createResourceApi } from './factory';

const api = createResourceApi('/quotations');

export const getQuotations = api.getAll;
export const getQuotation = api.getById;
