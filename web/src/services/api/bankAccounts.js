import { createResourceApi } from './factory';

const api = createResourceApi('/bank-accounts');

export const getBankAccounts = api.getAll;
export const getBankAccount = api.getById;
export const createBankAccount = api.create;
export const updateBankAccount = api.update;
export const deleteBankAccount = api.remove;
