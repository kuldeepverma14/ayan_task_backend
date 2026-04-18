import { Router } from 'express';
import { getStats, getActivity } from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/stats', getStats);
router.get('/activity', getActivity);

export default router;
