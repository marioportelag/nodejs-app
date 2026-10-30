import { Router, type RequestHandler } from 'express';
import { getUserById, listUsers } from './user.controller.js';

export function createUserRouter(authenticate: RequestHandler): Router {
  const router = Router();

  router.use(authenticate);
  router.get('/', listUsers);
  router.get('/:id', getUserById);

  return router;
}
