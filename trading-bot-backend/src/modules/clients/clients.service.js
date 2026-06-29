const prisma = require('../../prisma/client');

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all active clients
 */
const getAllClients = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: { vessels: true },
      orderBy: { name: 'asc' },
      skip,
      take
    }),
    prisma.client.count({ where })
  ]);

  return { data: clients, total };
};

/**
 * Get client by ID
 */
const getClientById = async (id) => {
  return await prisma.client.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null },
    include: { vessels: true }
  });
};

/**
 * Create client
 */
const createClient = async (data, creatorId) => {
  // Check for duplicate client (by email only)
  const existingClient = await prisma.client.findFirst({
    where: {
      email: data.email,
      deletedAt: null
    }
  });

  if (existingClient) {
    const err = new Error(`A client with this email already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.client.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      address: data.address || null,
      createdById: creatorId,
      isActive: data.isActive !== undefined ? data.isActive : true,
      ...(data.vessels && data.vessels.length > 0 && {
        vessels: {
          create: data.vessels.map(v => ({
            name: v.name,
            imoNumber: v.imoNumber || null
          }))
        }
      })
    },
    include: { vessels: true }
  });
};

/**
 * Update client
 */
const updateClient = async (id, data, updaterId) => {
  const clientId = parseInt(id, 10);
  // Check for duplicate client (by email) excluding the current client
  const existingClient = await prisma.client.findFirst({
    where: {
      id: { not: clientId },
      email: data.email,
      deletedAt: null
    }
  });

  if (existingClient) {
    const err = new Error(`A client with this email already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    if (data.vessels) {
      await tx.clientVessel.deleteMany({
        where: { clientId: clientId }
      });
    }

    return await tx.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        address: data.address,
        isActive: data.isActive,
        updatedById: updaterId,
        ...(data.vessels && data.vessels.length > 0 && {
          vessels: {
            create: data.vessels.map(v => ({
              name: v.name,
              imoNumber: v.imoNumber || null
            }))
          }
        })
      },
      include: { vessels: true }
    });
  });
};

/**
 * Soft delete client
 */
const deleteClient = async (id, updaterId) => {
  return await prisma.client.update({
    where: { id: parseInt(id, 10) },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

/**
 * Bulk import clients (queues a job)
 */
const bulkImportClients = async (clientsArray, updaterId) => {
  const { documentQueue } = require('../../utils/queue');
  const job = await documentQueue.add('bulkImportClients', { clientsArray, updaterId });
  return { successCount: clientsArray.length, status: 'queued', jobId: job.id };
};

/**
 * Execute bulk import job (called by Worker)
 */
const executeBulkImportClientsJob = async (clientsArray, updaterId) => {
  let successCount = 0;
  const errors = [];

  for (const data of clientsArray) {
    try {
      // Determine whether to update or create
      let shouldUpdate = false;
      if (data.id) {
        const existing = await prisma.client.findFirst({
          where: { id: parseInt(data.id, 10), deletedAt: null }
        });
        shouldUpdate = !!existing;
      }

      if (shouldUpdate) {
        const clientId = parseInt(data.id, 10);
        await prisma.$transaction(async (tx) => {
          if (data.vessels) {
            await tx.clientVessel.deleteMany({ where: { clientId } });
          }
          await tx.client.update({
            where: { id: clientId },
            data: {
              name: data.name,
              email: data.email,
              phone: data.phone || null,
              company: data.company || null,
              address: data.address || null,
              isActive: data.isActive !== undefined ? data.isActive : true,
              updatedById: updaterId,
              ...(data.vessels && data.vessels.length > 0 && {
                vessels: {
                  create: data.vessels.map(v => ({ name: v.name, imoNumber: v.imoNumber || null }))
                }
              })
            }
          });
        });
      } else {
        // Check for email duplicate before creating
        const duplicate = await prisma.client.findFirst({
          where: { email: data.email, deletedAt: null }
        });
        if (duplicate) {
          errors.push({ email: data.email, error: 'A client with this email already exists' });
          continue;
        }

        await prisma.client.create({
          data: {
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            company: data.company || null,
            address: data.address || null,
            createdById: updaterId,
            isActive: data.isActive !== undefined ? data.isActive : true,
            ...(data.vessels && data.vessels.length > 0 && {
              vessels: {
                create: data.vessels.map(v => ({ name: v.name, imoNumber: v.imoNumber || null }))
              }
            })
          }
        });
      }

      successCount++;
    } catch (err) {
      errors.push({ email: data.email || null, error: err.message });
    }
  }

  return { successCount, errors };
};


module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  bulkImportClients,
  executeBulkImportClientsJob
};
