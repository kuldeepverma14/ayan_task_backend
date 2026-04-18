import { Router } from 'express';
import { getLogs } from '../controllers/audit.controller.js';
import { verifyJWT, checkPermission } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', checkPermission('/audit-logs', 'canView'), getLogs);

export default router;
