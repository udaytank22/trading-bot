const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');
const { getPaginationParams } = require('../../utils/queryHelper');

/**
 * Get all employees
 */
const getAllEmployees = async (query = {}) => {
  const where = { deletedAt: null };

  const { skip, take } = getPaginationParams(query);

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
      status: data.status || 'INACTIVE',
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
  logAttendance,
  setEmployeePassword: async (employeeId, password, creatorId) => {
    const numericId = Number(employeeId);
    const employee = await prisma.employee.findFirst({
      where: { id: numericId, deletedAt: null }
    });

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { employeeProfileId: numericId },
          { email: employee.email }
        ],
        deletedAt: null
      }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          employeeProfileId: numericId,
          updatedById: creatorId
        }
      });
    } else {
      let role = await prisma.role.findFirst({
        where: {
          name: { in: ['Employee', 'User', 'Admin'] }
        }
      });

      if (!role) {
        role = await prisma.role.findFirst();
      }

      user = await prisma.user.create({
        data: {
          email: employee.email,
          password: hashedPassword,
          roleId: role.id,
          employeeProfileId: numericId,
          createdById: creatorId,
          isActive: true
        }
      });
    }

    // Update employee status to ACTIVE when password is set / access is granted
    await prisma.employee.update({
      where: { id: numericId },
      data: {
        status: 'ACTIVE',
        updatedById: creatorId
      }
    });

    return { id: user.id, email: user.email };
  }
};
