import { Router } from 'express';
import { getUserById, getUsers } from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/:id', verifyToken, getUserById);

router.get('/', verifyToken, getUsers);

export default router;
