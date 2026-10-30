import jwt from 'jsonwebtoken';
import { pino } from 'pino';
import { createApp } from '../src/app.js';
import { loadConfig, type AppConfig } from '../src/config/env.js';

// Test-only values, generated for this suite; never used outside tests.
export const TEST_ENV = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  JWT_SECRET: 'test-secret-0123456789-abcdefghijklmnopqrstuvwxyz',
  JWT_EXPIRES_IN_SECONDS: '900',
  JWT_ISSUER: 'nodejs-app',
  JWT_AUDIENCE: 'nodejs-app-api',
  DEMO_USERNAME: 'demo',
  DEMO_PASSWORD: 'correct-horse-battery-staple',
  LOGIN_RATE_LIMIT_MAX: '1000',
} as const;

export const DEMO_CREDENTIALS = { username: TEST_ENV.DEMO_USERNAME, password: TEST_ENV.DEMO_PASSWORD };

export function buildTestConfig(overrides: Record<string, string> = {}): AppConfig {
  return loadConfig({ ...TEST_ENV, ...overrides });
}

export function buildTestApp(overrides: Record<string, string> = {}) {
  return createApp({ config: buildTestConfig(overrides), logger: pino({ level: 'silent' }) });
}

/** Signs an arbitrary token with full control over claims, secret and algorithm. */
export function signToken(
  claims: Record<string, unknown>,
  { secret = TEST_ENV.JWT_SECRET, algorithm = 'HS256' }: { secret?: string; algorithm?: jwt.Algorithm } = {},
): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    {
      sub: TEST_ENV.DEMO_USERNAME,
      iss: TEST_ENV.JWT_ISSUER,
      aud: TEST_ENV.JWT_AUDIENCE,
      iat: now,
      exp: now + 600,
      ...claims,
    },
    secret,
    { algorithm },
  );
}

export function expiredToken(): string {
  const now = Math.floor(Date.now() / 1000);
  return signToken({ iat: now - 3600, exp: now - 60 });
}

/** An unsigned token using the "none" algorithm. */
export function unsignedToken(): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({
    sub: TEST_ENV.DEMO_USERNAME,
    iss: TEST_ENV.JWT_ISSUER,
    aud: TEST_ENV.JWT_AUDIENCE,
    iat: now,
    exp: now + 600,
  })}.`;
}
