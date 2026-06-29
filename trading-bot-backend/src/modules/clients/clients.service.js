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
  const result = await executeBulkImportClientsJob(clientsArray, updaterId);
  return { successCount: result.successCount, status: 'completed' };
};

/**
 * Execute bulk import job (called by Worker)
 */
const executeBulkImportClientsJob = async (clientsArray, updaterId) => {
  let successCount = 0;
  const errors = [];

  const providedIds = clientsArray.filter(c => c.id).map(c => parseInt(c.id, 10));
  const providedEmails = clientsArray.map(c => c.email.toLowerCase());

  const [existingById, existingByEmail] = await Promise.all([
    providedIds.length > 0
      ? prisma.client.findMany({ where: { id: { in: providedIds }, deletedAt: null } })
      : [],
    providedEmails.length > 0
      ? prisma.client.findMany({ where: { email: { in: providedEmails }, deletedAt: null } })
      : []
  ]);

  const existingIdMap = new Map(existingById.map(c => [c.id, c]));
  const existingEmailMap = new Map(existingByEmail.map(c => [c.email.toLowerCase(), c]));

  const toCreate = [];
  const toUpdate = [];

  for (const data of clientsArray) {
    const parsedId = data.id ? parseInt(data.id, 10) : null;
    const emailLower = data.email.toLowerCase();
    
    let shouldUpdate = false;

    if (parsedId && existingIdMap.has(parsedId)) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      toUpdate.push({ data, parsedId });
    } else {
      if (existingEmailMap.has(emailLower)) {
        errors.push({ email: data.email, error: 'A client with this email already exists' });
        continue;
      }
      if (toCreate.find(item => item.data.email.toLowerCase() === emailLower)) {
        errors.push({ email: data.email, error: 'Duplicate email in the import file' });
        continue;
      }

      toCreate.push({ data });
    }
  }

  if (toCreate.length > 0) {
    try {
      const createPromises = toCreate.map(item => 
        prisma.client.create({
          data: {
            name: item.data.name,
            email: item.data.email,
            phone: item.data.phone || null,
            company: item.data.company || null,
            address: item.data.address || null,
            createdById: updaterId,
            isActive: item.data.isActive !== undefined ? item.data.isActive : true,
            ...(item.data.vessels && item.data.vessels.length > 0 && {
              vessels: {
                create: item.data.vessels.map(v => ({ name: v.name, imoNumber: v.imoNumber || null }))
              }
            })
          }
        })
      );
      
      const chunkSize = 100;
      for (let i = 0; i < createPromises.length; i += chunkSize) {
        const chunk = createPromises.slice(i, i + chunkSize);
        await prisma.$transaction(chunk);
        successCount += chunk.length;
      }
    } catch (err) {
      errors.push({ error: `Failed to bulk create new clients: ${err.message}` });
    }
  }

  if (toUpdate.length > 0) {
    try {
      const updateOperations = [];
      for (const item of toUpdate) {
        if (item.data.vessels) {
          updateOperations.push(prisma.clientVessel.deleteMany({ where: { clientId: item.parsedId } }));
        }
        updateOperations.push(prisma.client.update({
          where: { id: item.parsedId },
          data: {
            name: item.data.name,
            email: item.data.email,
            phone: item.data.phone || null,
            company: item.data.company || null,
            address: item.data.address || null,
            isActive: item.data.isActive !== undefined ? item.data.isActive : true,
            updatedById: updaterId,
            ...(item.data.vessels && item.data.vessels.length > 0 && {
              vessels: {
                create: item.data.vessels.map(v => ({ name: v.name, imoNumber: v.imoNumber || null }))
              }
            })
          }
        }));
      }

      const chunkSize = 100;
      for (let i = 0; i < updateOperations.length; i += chunkSize) {
        const chunk = updateOperations.slice(i, i + chunkSize);
        await prisma.$transaction(chunk);
      }
      successCount += toUpdate.length;
    } catch (err) {
      errors.push({ error: `Failed to update existing clients: ${err.message}` });
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
