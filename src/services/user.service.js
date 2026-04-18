import prisma from '../config/prisma.js';
import { getPaginatedData } from '../utils/paginator.js';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';


export const getAvailableRoles = async () => {
  return await prisma.role.findMany({
    orderBy: { name: 'asc' }
  });
};


export const getAllUsers = async (query) => {
  const { page, limit, search, roleId, status } = query;

  const where = { AND: [] };

  if (search) {
    where.AND.push({
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { role: { name: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  if (roleId && roleId !== 'all') {
    where.AND.push({ roleId });
  }

  if (status && status !== 'all') {
    const isStatusActive = status === 'active';
    where.AND.push({ status: isStatusActive });
  }

  return await getPaginatedData({
    model: prisma.user,
    query,
    where: where.AND.length > 0 ? where : {},
    include: {
      role: {
        select: {
          id: true,
          name: true,
          description: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createUserByAdmin = async (userData) => {
  const { password, email, roleId, firstName, lastName, ...rest } = userData;

  if (!email || !password || !roleId || !firstName || !lastName) {
    throw new ApiError(400, "Missing mandatory identity fields (email, password, roleId, firstName, lastName)");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(400, "Identity already registered with this email");

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new ApiError(404, "Target security role does not exist in the matrix");

  const hashedPassword = await bcrypt.hash(password, 10);

  return await prisma.user.create({
    data: {
      ...rest,
      firstName,
      lastName,
      email,
      roleId,
      password: hashedPassword
    }
  });
};

export const updateUserByAdmin = async (id, userData) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Identity not found in registry");

  const { password, email, roleId, ...updateData } = userData;

  if (roleId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new ApiError(404, "Target security role does not exist");
    updateData.roleId = roleId;
  }

  return await prisma.user.update({
    where: { id },
    data: updateData
  });
};

export const toggleUserStatus = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Identity not found in registry");

  return await prisma.user.update({
    where: { id },
    data: { status: !user.status }
  });
};

export const deleteUser = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Identity already purged or non-existent");

  return await prisma.user.delete({ where: { id } });
};
