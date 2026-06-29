const prisma = require('../../prisma/client');

/**
 * Resolve document validity status dynamically from its expiry date
 */
const resolveDocumentStatus = (expiryDate) => {
  if (!expiryDate) return 'VALID';
  const now = new Date();
  const exp = new Date(expiryDate);
  
  if (exp < now) {
    return 'EXPIRED';
  }
  
  const diffTime = Math.abs(exp - now);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) {
    return 'EXPIRING_SOON';
  }
  
  return 'VALID';
};

const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all documents
 */
const getAllDocuments = async (query = {}) => {
  const { entityType, entityId } = query;
  const where = { deletedAt: null };
  if (typeof entityType === 'string' && entityType.trim() !== '') {
    where.entityType = entityType;
  }
  if (typeof entityId === 'string' && entityId.trim() !== '') {
    where.entityId = entityId;
  }

  const { skip, take } = getPaginationParams(query);

  const [docs, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: { id: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.document.count({ where })
  ]);

  // Dynamically recalculate and update statuses on fetch
  const mappedDocs = docs.map((doc) => ({
    ...doc,
    status: resolveDocumentStatus(doc.expiryDate)
  }));
  return { data: mappedDocs, total };
};

/**
 * Get document details by ID
 */
const getDocumentById = async (id) => {
  const doc = await prisma.document.findFirst({
    where: { id, deletedAt: null },
    include: {
      uploadedBy: { select: { id: true, email: true } }
    }
  });

  if (!doc) return null;
  
  return {
    ...doc,
    status: resolveDocumentStatus(doc.expiryDate)
  };
};

/**
 * Create a new document metadata record
 */
const createDocument = async (data, uploaderId) => {
  const status = resolveDocumentStatus(data.expiryDate);

  return await prisma.document.create({
    data: {
      title: data.title,
      category: data.category,
      entityType: data.entityType,
      entityId: data.entityId,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      status,
      filePath: data.filePath || '',
      uploadedById: uploaderId,
      createdById: uploaderId
    }
  });
};

/**
 * Update document details
 */
const updateDocument = async (id, data, updaterId) => {
  const updateData = {
    updatedById: updaterId
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.entityType !== undefined) updateData.entityType = data.entityType;
  if (data.entityId !== undefined) updateData.entityId = data.entityId;
  if (data.filePath !== undefined) updateData.filePath = data.filePath;
  
  if (data.expiryDate !== undefined) {
    updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    updateData.status = resolveDocumentStatus(data.expiryDate);
  }

  return await prisma.document.update({
    where: { id },
    data: updateData
  });
};

/**
 * Soft delete document record
 */
const deleteDocument = async (id, updaterId) => {
  return await prisma.document.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

module.exports = {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  resolveDocumentStatus
};
