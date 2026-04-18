import { Router } from 'express';
import { verifyJWT, isSuperAdmin } from '../middlewares/auth.middleware.js';
import {
  getArchitecture,
  reorderModules,
  reorderPages,
  deleteModule,
  deletePage,
  createModule,
  createPage
} from '../controllers/module.controller.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getArchitecture);
router.patch('/reorder', isSuperAdmin, reorderModules);
router.post('/parent', isSuperAdmin, createModule);
router.post('/page', isSuperAdmin, createPage);
router.patch('/pages/reorder', isSuperAdmin, reorderPages);
router.delete('/:id', isSuperAdmin, deleteModule);
router.delete('/pages/:id', isSuperAdmin, deletePage);

export default router;
