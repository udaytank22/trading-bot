const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
/**
 * Get all employees
 */
const getAllEmployees = async (query = {}) => {
  const { page, pageSize, paginate } = query;
  const where = { deletedAt: null };

  if (paginate === 'false') {
    const employees = await prisma.employee.findMany({
      where,
      orderBy: { fullName: 'asc' }
    });
    return { data: employees, total: employees.length };
  }

  const skip = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : undefined;
  const take = pageSize ? parseInt(pageSize) : undefined;

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        attendance: {
          orderBy: { date: 'desc' },
          take: 30
        }
      },
      orderBy: { fullName: 'asc' },
      skip,
      take
    }),
    prisma.employee.count({ where })
  ]);

  return { data: employees, total };
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (id) => {
  return await prisma.employee.findFirst({
    where: { id, deletedAt: null },
    include: {
      attendance: {
        orderBy: { date: 'desc' }
      },
      documents: true
    }
  });
};

/**
 * Create a new employee profile
 */
const createEmployee = async (data, creatorId) => {
  // Check for duplicate employee (by email)
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      email: data.email,
      deletedAt: null
    }
  });

  if (existingEmployee) {
    const err = new Error('An employee with this email already exists.');
    err.statusCode = 400;
    throw err;
  }

  return await prisma.employee.create({
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      department: data.department || null,
      designation: data.designation || null,
      roleId: data.roleId || null,
      salary: data.salary ? parseFloat(data.salary) : null,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : null,
      status: data.status || 'ACTIVE',
      createdById: creatorId
    }
  });
};

/**
 * Update employee profile
 */
const updateEmployee = async (id, data, updaterId) => {
  // Check for duplicate employee (by email) excluding the current employee
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      id: { not: id },
      email: data.email,
      deletedAt: null
    }
  });

  if (existingEmployee) {
    const err = new Error('An employee with this email already exists.');
    err.statusCode = 400;
    throw err;
  }

  return await prisma.employee.update({
    where: { id },
    data: {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      department: data.department,
      designation: data.designation,
      roleId: data.roleId,
      salary: data.salary ? parseFloat(data.salary) : undefined,
      joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
      status: data.status,
      updatedById: updaterId
    }
  });
};

/**
 * Soft delete employee profile
 */
const deleteEmployee = async (id, updaterId) => {
  return await prisma.employee.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: 'INACTIVE',
      updatedById: updaterId
    }
  });
};

/**
 * Record or update attendance for an employee on a specific date
 */
const logAttendance = async (employeeId, data) => {
  const dateVal = data.date ? new Date(data.date) : new Date();

  // Extract UTC Date without time parts to avoid timezone mismatch
  const y = dateVal.getFullYear();
  const m = dateVal.getMonth();
  const d = dateVal.getDate();
  const truncatedDate = new Date(Date.UTC(y, m, d));

  return await prisma.attendance.upsert({
    where: {
      employeeId_date: {
        employeeId,
        date: truncatedDate
      }
    },
    update: {
      status: data.status, // PRESENT, LATE, SICK_LEAVE, OFF_DAY
      checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined,
      checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : undefined,
      remarks: data.remarks || null
    },
    create: {
      employeeId,
      date: truncatedDate,
      status: data.status,
      checkInTime: data.checkInTime ? new Date(data.checkInTime) : null,
      checkOutTime: data.checkOutTime ? new Date(data.checkOutTime) : null,
      remarks: data.remarks || null
    }
  });
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  logAttendance
};
