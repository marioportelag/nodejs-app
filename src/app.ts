import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import { requireAuth } from './auth/auth.middleware.js';
import { createAuthRouter } from './auth/auth.routes.js';
import { DemoCredentialVerifier, type CredentialVerifier } from './auth/credentials.js';
import { TokenService } from './auth/token.service.js';
import type { AppConfig } from './config/env.js';
import { createErrorHandler, notFoundHandler } from './http/error-handler.js';
import { createUserRouter } from './users/user.routes.js';

export interface AppDependencies {
  config: AppConfig;
  logger: Logger;
  /** Defaults to the env-configured demo account. */
  verifier?: CredentialVerifier;
}

export function createApp({ config, logger, verifier }: AppDependencies): Express {
  const tokenService = new TokenService(config.jwt);
  const credentialVerifier = verifier ?? new DemoCredentialVerifier(config.demoAuth);

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);

  app.use(helmet());
  app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/health' } }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/greetings', (_req, res) => {
    res.json({ message: 'greetings' });
  });

  app.use(
    '/auth',
    createAuthRouter({ verifier: credentialVerifier, tokenService, rateLimit: config.loginRateLimit }),
  );
  app.use('/users', createUserRouter(requireAuth(tokenService)));

  app.use(notFoundHandler);
  app.use(createErrorHandler(logger));

  return app;
}
