import { Router } from 'express';
import { verifyJWT, isSuperAdmin } from '../middlewares/auth.middleware.js';
import { getRoles, getRoleById, updateRolePermissions } from '../controllers/role.controller.js';

const router = Router();

router.use(verifyJWT);
router.use(isSuperAdmin); 

router.get('/', getRoles);
router.get('/:id', getRoleById);
router.post('/:id/permissions', updateRolePermissions);

export default router;
