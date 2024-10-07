import { Router } from 'express';
import { getUserById, getUsers } from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/users/:id', verifyToken, getUserById);

router.get('/users', verifyToken, getUsers);

export default router;
