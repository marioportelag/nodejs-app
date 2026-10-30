import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { AppConfig } from '../config/env.js';
import { HttpError } from '../http/errors.js';
import { createLoginHandler } from './auth.controller.js';
import type { CredentialVerifier } from './credentials.js';
import type { TokenService } from './token.service.js';

interface AuthRouterDeps {
  verifier: CredentialVerifier;
  tokenService: TokenService;
  rateLimit: AppConfig['loginRateLimit'];
}

export function createAuthRouter({ verifier, tokenService, rateLimit: limits }: AuthRouterDeps): Router {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: limits.windowMs,
    limit: limits.max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(new HttpError(429, 'too_many_requests', 'Too many login attempts, please try again later'));
    },
  });

  router.post('/login', loginLimiter, createLoginHandler(verifier, tokenService));

  return router;
}
