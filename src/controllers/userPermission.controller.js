import prisma from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Get individual permissions for a specific user
 */
export const getUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Identity not found in registry");

  const pages = await prisma.page.findMany({
    include: { module: true }
  });

  const overrides = await prisma.userPermission.findMany({
    where: { userId: id }
  });

  return res.status(200).json(ApiResponse(200, { pages, overrides }, "User permissions fetched"));
});

/**
 * Sync individual permissions for a specific user
 */
export const syncUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions } = req.body; 

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(404, "Cannot synchronize matrix for non-existent identity");

  if (!permissions || !Array.isArray(permissions)) {
    throw new ApiError(400, "Invalid sovereignty matrix format");
  }

  // Integrity Guard: Verify ALL Page IDs exist to prevent FK violations
  const pageIds = permissions.map(p => p.pageId);
  const existingPagesCount = await prisma.page.count({
    where: { id: { in: pageIds } }
  });

  if (existingPagesCount !== pageIds.length) {
    throw new ApiError(400, "Integrity Violation: One or more Page IDs in the matrix do not exist in the architecture registry");
  }

  await prisma.$transaction([
    prisma.userPermission.deleteMany({ where: { userId: id } }),
    prisma.userPermission.createMany({
      data: permissions.map(p => ({
        userId: id,
        pageId: p.pageId,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      }))
    })
  ]);

  return res.status(200).json(ApiResponse(200, null, "User sovereignty matrix synchronized"));
});
