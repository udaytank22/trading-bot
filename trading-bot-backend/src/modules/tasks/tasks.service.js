const prisma = require('../../prisma/client');
const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all tasks with pagination, search, and status filters
 */
const getAllTasks = async (query = {}) => {
  const where = { deletedAt: null };

  if (query.status) {
    where.status = query.status;
  }
  if (query.priority) {
    where.priority = query.priority;
  }
  if (query.assignedEmployeeId) {
    where.assignedEmployeeId = parseInt(query.assignedEmployeeId, 10);
  }
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  const { skip, take } = getPaginationParams(query);

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignedEmployee: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.task.count({ where })
  ]);

  return { data: tasks, total };
};

/**
 * Get a single task by ID
 */
const getTaskById = async (id) => {
  return await prisma.task.findFirst({
    where: { id: parseInt(id, 10), deletedAt: null },
    include: {
      assignedEmployee: true
    }
  });
};

/**
 * Find a suitable employee to assign a task based on AI suggestions or defaults
 */
const findEmployeeForAssignment = async (suggestedName, suggestedDepartment) => {
  // 1. Try to find by name match
  if (suggestedName && suggestedName.trim()) {
    const employee = await prisma.employee.findFirst({
      where: {
        fullName: { contains: suggestedName.trim(), mode: 'insensitive' },
        status: 'ACTIVE',
        deletedAt: null
      }
    });
    if (employee) return employee;
  }

  // 2. Try to find by department match
  if (suggestedDepartment && suggestedDepartment.trim()) {
    const employee = await prisma.employee.findFirst({
      where: {
        department: { contains: suggestedDepartment.trim(), mode: 'insensitive' },
        status: 'ACTIVE',
        deletedAt: null
      }
    });
    if (employee) return employee;
  }

  // 3. Fallback: first active employee
  const defaultEmployee = await prisma.employee.findFirst({
    where: { status: 'ACTIVE', deletedAt: null }
  });
  if (defaultEmployee) return defaultEmployee;

  // 4. Ultimate fallback: any employee
  return await prisma.employee.findFirst({
    where: { deletedAt: null }
  });
};

/**
 * Create a new task
 */
const createTask = async (data) => {
  let employeeId = data.assignedEmployeeId ? parseInt(data.assignedEmployeeId, 10) : null;

  // If no employee ID is specified, but suggested info is present, perform auto-assignment
  if (!employeeId && (data.suggestedEmployeeName || data.suggestedDepartment)) {
    const assignedEmp = await findEmployeeForAssignment(data.suggestedEmployeeName, data.suggestedDepartment);
    if (assignedEmp) {
      employeeId = assignedEmp.id;
    }
  }

  // Final fallback to first employee if still null and we want robust assignment
  if (!employeeId) {
    const fallbackEmp = await prisma.employee.findFirst({
      where: { deletedAt: null }
    });
    if (fallbackEmp) {
      employeeId = fallbackEmp.id;
    }
  }

  return await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || null,
      status: data.status || 'PENDING',
      priority: data.priority || 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      assignedEmployeeId: employeeId,
      emailId: data.emailId || null
    },
    include: {
      assignedEmployee: true
    }
  });
};

/**
 * Update a task
 */
const updateTask = async (id, data) => {
  const taskId = parseInt(id, 10);
  
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.assignedEmployeeId !== undefined) {
    updateData.assignedEmployeeId = data.assignedEmployeeId ? parseInt(data.assignedEmployeeId, 10) : null;
  }

  return await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignedEmployee: true
    }
  });
};

/**
 * Soft delete a task
 */
const deleteTask = async (id) => {
  return await prisma.task.update({
    where: { id: parseInt(id, 10) },
    data: {
      deletedAt: new Date()
    }
  });
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  findEmployeeForAssignment
};
