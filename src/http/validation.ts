import type { z } from 'zod';
import { ValidationError } from './errors.js';

/** Parses untrusted request input, throwing a 400 ValidationError on failure. */
export function parseRequest<Schema extends z.ZodType>(schema: Schema, input: unknown): z.infer<Schema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
      })),
    );
  }

  return result.data;
}
