const { Queue, Worker } = require('bullmq');
const logger = require('./logger');

let connection;
if (process.env.REDIS_URL) {
  connection = new require('ioredis')(process.env.REDIS_URL, { maxRetriesPerRequest: null });
} else {
  connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
  };
}

const emailQueue = new Queue('email-queue', { connection });
const documentQueue = new Queue('document-queue', { connection });

const isDev = process.env.NODE_ENV !== 'production';

emailQueue.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && isDev) return;
  logger.error({ err }, 'emailQueue Redis error')
});
documentQueue.on('error', (err) => {
  if (err.code === 'ECONNREFUSED' && isDev) return;
  logger.error({ err }, 'documentQueue Redis error')
});

const setupWorkers = () => {
  logger.info('Initializing BullMQ workers...');

  const emailWorker = new Worker('email-queue', async (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing email job');
    
    if (job.name === 'sendInvoiceEmail') {
      const { invoiceId, emailSubject, emailBody, toEmail, updaterId } = job.data;
      const { executeInvoiceEmailJob } = require('../modules/invoices/invoices.service');
      return await executeInvoiceEmailJob(invoiceId, emailSubject, emailBody, updaterId, toEmail);
    }
  }, { connection });

  emailWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Email job completed successfully');
  });

  emailWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Email job failed');
  });

  emailWorker.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' && isDev) return;
    logger.error({ err }, 'emailWorker Redis error');
  });

  const documentWorker = new Worker('document-queue', async (job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing document job');
    
    if (job.name === 'bulkImportClients') {
      const { clientsArray, updaterId } = job.data;
      const { executeBulkImportClientsJob } = require('../modules/clients/clients.service');
      return await executeBulkImportClientsJob(clientsArray, updaterId);
    }
    
    if (job.name === 'bulkUpsertProducts') {
      const { products, creatorId } = job.data;
      const { executeBulkUpsertProductsJob } = require('../modules/products/products.service');
      return await executeBulkUpsertProductsJob(products, creatorId);
    }
    
    if (job.name === 'bulkImportSuppliers') {
      const { suppliersArray, updaterId } = job.data;
      const { executeBulkImportSuppliersJob } = require('../modules/suppliers/suppliers.service');
      return await executeBulkImportSuppliersJob(suppliersArray, updaterId);
    }
    
    if (job.name === 'bulkImportVehicles') {
      const { vehiclesArray } = job.data;
      const { executeBulkImportVehiclesJob } = require('../modules/vehicles/vehicles.service');
      return await executeBulkImportVehiclesJob(vehiclesArray);
    }
  }, { connection });

  documentWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Document job completed successfully');
  });

  documentWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Document job failed');
  });

  documentWorker.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' && isDev) return;
    logger.error({ err }, 'documentWorker Redis error');
  });
};

module.exports = {
  emailQueue,
  documentQueue,
  setupWorkers
};
