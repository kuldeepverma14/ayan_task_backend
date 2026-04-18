import { Router } from 'express';
import { verifyJWT, isSuperAdmin } from '../middlewares/auth.middleware.js';
import { getUserPermissions, syncUserPermissions } from '../controllers/userPermission.controller.js';

const router = Router();

router.use(verifyJWT);
router.use(isSuperAdmin);

router.get('/:id/permissions', getUserPermissions);
router.post('/:id/permissions', syncUserPermissions);

export default router;
