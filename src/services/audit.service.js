import prisma from '../config/prisma.js';
import { getPaginatedData } from '../utils/paginator.js';

/**
 * Log a system activity
 */
export const createLog = async ({
  userId,
  action,
  entity,
  entityId = null,
  details = null,
  req = null
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId?.toString(),
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip || null,
        userAgent: req?.headers['user-agent'] || null,
      }
    });
  } catch (error) {
    console.error('Audit Log failed:', error);
  }
};

/**
 * Get all logs (Paginated) - UPGRADED WITH GLOBAL SEARCH
 */
export const getAllLogs = async (query) => {
  const { action, entity, userId, search } = query;
  
  const where = { AND: [] };

  if (action) where.AND.push({ action });
  if (entity) where.AND.push({ entity });
  if (userId) where.AND.push({ userId });

  // Add Global Search across multiple fields
  if (search) {
    where.AND.push({
      OR: [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ]
    });
  }

  return await getPaginatedData({
    model: prisma.auditLog,
    query,
    where: where.AND.length > 0 ? where : {},
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });
};
