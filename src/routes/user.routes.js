import { Router } from 'express';
import { getUsers, removeUser, toggleStatus, addUser, getAllRoles, editUser } from '../controllers/user.controller.js';
import { verifyJWT, isSuperAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyJWT);

router.get('/', getUsers);
router.get('/roles', getAllRoles);
router.post('/', isSuperAdmin, addUser);
router.patch('/:id', isSuperAdmin, editUser); // Add edit route
router.delete('/:id', isSuperAdmin, removeUser);
router.patch('/:id/status', isSuperAdmin, toggleStatus);

export default router;
