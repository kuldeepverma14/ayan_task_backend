import prisma from '../config/prisma.js';
import { getPaginatedData } from '../utils/paginator.js';

export const getDashboardStats = async (user) => {
  // Stats are generally visible to all authenticated admins
  const [totalUsers, activeUsers, totalLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: true } }),
    prisma.auditLog.count()
  ]);

  return {
    totalUsers,
    activeUsers,
    totalLogs,
    growth: "+12.5%"
  };
};


export const getActivityHistory = async (user, query) => {
  const where = {};

  if (user.role.name !== 'SUPER_ADMIN') {
    where.userId = user.id;
  }

  return await getPaginatedData({
    model: prisma.auditLog,
    query,
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};
