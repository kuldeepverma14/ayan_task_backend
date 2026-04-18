import { Router } from 'express';
import { register, login, logout, refresh, getMe } from '../controllers/auth.controller.js';
import { rateLimitMiddleware } from '../middlewares/rateLimiter.js';
import { verifyJWT, optionalAuth } from '../middlewares/auth.middleware.js';
import { validate, registerSchema, loginSchema } from '../utils/validator.js';

const router = Router();

router.use(rateLimitMiddleware);

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', verifyJWT, getMe);

export default router;
