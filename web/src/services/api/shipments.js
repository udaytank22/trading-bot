import { createResourceApi } from './factory';

const api = createResourceApi('/shipments');

export const getShipments = api.getAll;
export const getShipment = api.getById;
export const createShipment = api.create;
export const updateShipment = api.update;
export const deleteShipment = api.remove;
