import prisma from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { createLog } from '../services/audit.service.js';

/**
 * Get all roles and their counts
 */
export const getRoles = asyncHandler(async (req, res) => {
  const roles = await prisma.role.findMany({
    include: {
      _count: {
        select: { users: true }
      }
    }
  });
  return res.status(200).json(ApiResponse(200, roles, "Roles fetched successfully"));
});

/**
 * Get specific role with full permission matrix
 */
export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: { page: true }
      }
    }
  });
  
  if (!role) throw new ApiError(404, "Security Role not found in matrix");

  const allPages = await prisma.page.findMany();
  
  return res.status(200).json(ApiResponse(200, { role, allPages }, "Role details fetched"));
});

/**
 * Update permission matrix for a subordinate role
 */
export const updateRolePermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body; 
  const roleId = req.params.id;

  if (!permissions || !Array.isArray(permissions)) {
    throw new ApiError(400, "Invalid permission matrix format");
  }

  // 1. Verify Role Existence
  const roleExists = await prisma.role.findUnique({ where: { id: roleId } });
  if (!roleExists) throw new ApiError(404, "Cannot update permissions for non-existent role");

  // 2. Integrity Guard: Verify ALL Page IDs exist to prevent FK violations
  const pageIds = permissions.map(p => p.pageId);
  const existingPagesCount = await prisma.page.count({
    where: { id: { in: pageIds } }
  });

  if (existingPagesCount !== pageIds.length) {
    throw new ApiError(400, "Integrity Violation: One or more Page IDs in the matrix do not exist in the architecture registry");
  }

  const updatePromises = permissions.map(p => {
    return prisma.permission.upsert({
      where: {
        roleId_pageId: { roleId, pageId: p.pageId }
      },
      update: {
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      },
      create: {
        roleId,
        pageId: p.pageId,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
      }
    });
  });

  await Promise.all(updatePromises);
  
  await createLog({ 
    userId: req.user.id, 
    action: 'UPDATE_PERMISSIONS', 
    entity: 'Role', 
    entityId: roleId, 
    details: { roleName: roleExists.name }, 
    req 
  });

  return res.status(200).json(ApiResponse(200, {}, "Permissions updated successfully"));
});
