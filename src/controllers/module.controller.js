import prisma from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Get full Architecture (Modules + Pages)
 */
export const getArchitecture = asyncHandler(async (req, res) => {
  const modules = await prisma.module.findMany({
    include: { 
      pages: {
        orderBy: { sortOrder: 'asc' }
      } 
    },
    orderBy: { sortOrder: 'asc' }
  });
  return res.status(200).json(ApiResponse(200, modules, "Registry fetched"));
});

/**
 * REORDER MODULES
 */
export const reorderModules = asyncHandler(async (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) throw new ApiError(400, "Invalid order sequence provided");

  // Verify all IDs exist before attempting update to prevent P2025 crashes
  const ids = orders.map(o => o.id);
  const existingCount = await prisma.module.count({
    where: { id: { in: ids } }
  });

  if (existingCount !== ids.length) {
    throw new ApiError(404, "One or more Module IDs in the sequence are missing from the registry");
  }

  await prisma.$transaction(
    orders.map(o => 
      prisma.module.update({
        where: { id: o.id },
        data: { sortOrder: o.sortOrder }
      })
    )
  );

  return res.status(200).json(ApiResponse(200, null, "Module sequence updated"));
});

/**
 * REORDER PAGES
 */
export const reorderPages = asyncHandler(async (req, res) => {
  const { orders } = req.body;
  if (!orders || !Array.isArray(orders)) throw new ApiError(400, "Invalid order sequence provided");

  // Verify all IDs exist before attempting update
  const ids = orders.map(o => o.id);
  const existingCount = await prisma.page.count({
    where: { id: { in: ids } }
  });

  if (existingCount !== ids.length) {
    throw new ApiError(404, "One or more Page IDs in the sequence are missing from the registry");
  }

  await prisma.$transaction(
    orders.map(o => 
      prisma.page.update({
        where: { id: o.id },
        data: { sortOrder: o.sortOrder }
      })
    )
  );

  return res.status(200).json(ApiResponse(200, null, "Page sequence updated"));
});

/**
 * RECURSIVE DELETE MODULE (Deep Purge)
 */
export const deleteModule = asyncHandler(async (req, res) => {
  const moduleId = req.params.id;

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) throw new ApiError(404, "Parent Module not found in registry");

  const pages = await prisma.page.findMany({
    where: { moduleId },
    select: { id: true }
  });
  
  const pageIds = pages.map(p => p.id);

  await prisma.$transaction(async (tx) => {
    if (pageIds.length > 0) {
      await tx.permission.deleteMany({ where: { pageId: { in: pageIds } } });
      await tx.userPermission.deleteMany({ where: { pageId: { in: pageIds } } });
      await tx.page.deleteMany({ where: { moduleId } });
    }
    await tx.module.delete({ where: { id: moduleId } });
  });

  return res.status(200).json(ApiResponse(200, null, "Module and all nested registry entries terminated"));
});

/**
 * RECURSIVE DELETE PAGE
 */
export const deletePage = asyncHandler(async (req, res) => {
  const pageId = req.params.id;

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new ApiError(404, "Architecture Page not found in registry");

  await prisma.$transaction(async (tx) => {
    await tx.permission.deleteMany({ where: { pageId } });
    await tx.userPermission.deleteMany({ where: { pageId } });
    await tx.page.delete({ where: { id: pageId } });
  });

  return res.status(200).json(ApiResponse(200, null, "Page and associated authorities removed"));
});

/**
 * CREATE PARENT MODULE
 */
export const createModule = asyncHandler(async (req, res) => {
  const { name, icon } = req.body;
  if (!name) throw new ApiError(400, "Module name is mandatory");

  const newModule = await prisma.module.create({ data: { name, icon } });
  return res.status(201).json(ApiResponse(201, newModule, "Parent Module created"));
});

/**
 * CREATE PAGE
 */
export const createPage = asyncHandler(async (req, res) => {
  const { name, path, moduleId } = req.body;
  if (!name || !path || !moduleId) throw new ApiError(400, "Missing required architecture fields");

  const parentModule = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!parentModule) throw new ApiError(404, "Cannot register page to non-existent module");

  const newPage = await prisma.page.create({
    data: { name, path, moduleId }
  });
  return res.status(201).json(ApiResponse(201, newPage, "Page registered"));
});
