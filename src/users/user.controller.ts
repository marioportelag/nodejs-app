import type { RequestHandler } from 'express';
import { z } from 'zod';
import { NotFoundError } from '../http/errors.js';
import { parseRequest } from '../http/validation.js';
import { userStore } from './user.store.js';

const userIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,9}$/, 'must be a positive integer')
    .transform(Number),
});

export const listUsers: RequestHandler = (_req, res) => {
  res.json(userStore.findAll());
};

export const getUserById: RequestHandler = (req, res) => {
  const { id } = parseRequest(userIdParamsSchema, req.params);

  const user = userStore.findById(id);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json(user);
};
