import prisma from '../config/prisma.js';

export const getModulesWithPages = async () => {
  return await prisma.module.findMany({
    include: {
      pages: true
    },
    orderBy: { sortOrder: 'asc' }
  });
};

export const getRolePermissions = async (roleId) => {
  return await prisma.permission.findMany({
    where: { roleId },
    include: { page: true }
  });
};

export const updatePermissions = async (roleId, permissions) => {
  const promises = permissions.map(p => {
    return prisma.permission.upsert({
      where: {
        roleId_pageId: {
          roleId,
          pageId: p.pageId
        }
      },
      update: {
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      },
      create: {
        roleId,
        pageId: p.pageId,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      }
    });
  });

  return await Promise.all(promises);
};
