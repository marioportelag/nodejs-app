import { z } from 'zod';

export const loginRequestSchema = z.strictObject({
  username: z.string().trim().min(1, 'is required').max(128),
  password: z.string().min(1, 'is required').max(256),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
