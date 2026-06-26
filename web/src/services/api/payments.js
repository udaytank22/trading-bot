import { createResourceApi } from './factory';

const api = createResourceApi('/payments');

export const getPayments = api.getAll;
export const getPayment = api.getById;
export const createPayment = api.create;
export const deletePayment = api.remove;
