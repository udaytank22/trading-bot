const prisma = require('../../prisma/client');

/**
 * Get all active clients
 */
const getAllClients = async () => {
  return await prisma.client.findMany({
    where: { deletedAt: null },
    include: { vessels: true },
    orderBy: { name: 'asc' }
  });
};

/**
 * Get client by ID
 */
const getClientById = async (id) => {
  return await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: { vessels: true }
  });
};

/**
 * Create client
 */
const createClient = async (data, creatorId) => {
  // Check for duplicate client (by email or name)
  const existingClient = await prisma.client.findFirst({
    where: {
      OR: [
        { email: data.email },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingClient) {
    const err = new Error(`A client with this ${existingClient.email === data.email ? 'email' : 'name'} already exists.`);
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
  // Check for duplicate client (by email or name) excluding the current client
  const existingClient = await prisma.client.findFirst({
    where: {
      id: { not: id },
      OR: [
        { email: data.email },
        { name: data.name }
      ],
      deletedAt: null
    }
  });

  if (existingClient) {
    const err = new Error(`A client with this ${existingClient.email === data.email ? 'email' : 'name'} already exists.`);
    err.statusCode = 400;
    throw err;
  }

  return await prisma.$transaction(async (tx) => {
    if (data.vessels) {
      await tx.clientVessel.deleteMany({
        where: { clientId: id }
      });
    }

    return await tx.client.update({
      where: { id },
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
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

/**
 * Bulk import clients
 */
const bulkImportClients = async (clientsArray, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    let successCount = 0;
    for (const data of clientsArray) {
      if (data.id) {
        if (data.vessels) {
          await tx.clientVessel.deleteMany({ where: { clientId: data.id } });
        }
        await tx.client.update({
          where: { id: data.id },
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
                create: data.vessels.map(v => ({ name: v.name, imoNumber: v.imoNumber || null }))
              }
            })
          }
        });
      } else {
        await tx.client.create({
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
    }
    return { successCount };
  }, { timeout: 60000 });
};

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  bulkImportClients
};
