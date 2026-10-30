import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../http/errors.js';
import type { AccessTokenClaims, TokenService } from './token.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      auth?: AccessTokenClaims;
    }
  }
}

/**
 * Requires a valid `Authorization: Bearer <jwt>` header.
 * Every rejection path returns immediately, so protected handlers never run
 * for unauthenticated requests.
 */
export function requireAuth(tokenService: TokenService): RequestHandler {
  return (req, res, next) => {
    const header = req.get('authorization');

    if (!header) {
      next(new UnauthorizedError('missing_token', 'Authorization header is required'));
      return;
    }

    const [scheme, token, ...rest] = header.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
      next(new UnauthorizedError('invalid_token', 'Authorization header must use the Bearer scheme'));
      return;
    }

    try {
      res.locals.auth = tokenService.verify(token);
    } catch (error) {
      next(error);
      return;
    }

    next();
  };
}
