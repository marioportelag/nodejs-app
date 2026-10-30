import express from 'express';
import { pino } from 'pino';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireAuth } from '../src/auth/auth.middleware.js';
import { TokenService } from '../src/auth/token.service.js';
import { createErrorHandler } from '../src/http/error-handler.js';
import { buildTestConfig, expiredToken, signToken, TEST_ENV, unsignedToken } from './helpers.js';

/**
 * Exercises the middleware in isolation with a spy as the protected handler,
 * proving that rejected requests never reach it (regression for audit finding N1).
 */
const protectedHandler = vi.fn((_req: express.Request, res: express.Response) => {
  res.json({ ok: true, auth: res.locals.auth });
});

const app = express();
app.get('/protected', requireAuth(new TokenService(buildTestConfig().jwt)), protectedHandler);
app.use(createErrorHandler(pino({ level: 'silent' })));

beforeEach(() => {
  protectedHandler.mockClear();
});

describe('requireAuth', () => {
  it('rejects a request without an Authorization header', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer');
    expect(res.body.error.code).toBe('missing_token');
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it.each([
    ['non-Bearer scheme', 'Basic ZGVtbzpwYXNzd29yZA=='],
    ['Bearer without token', 'Bearer'],
    ['extra segments', 'Bearer a.b.c extra'],
  ])('rejects a malformed Authorization header (%s)', async (_case, header) => {
    const res = await request(app).get('/protected').set('Authorization', header);

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    expect(res.body.error.code).toBe('invalid_token');
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed JWT', () => 'not-a-jwt'],
    ['truncated JWT', () => signToken({}).split('.').slice(0, 2).join('.')],
    ['tampered payload', () => tamper(signToken({}))],
    ['wrong signing secret', () => signToken({}, { secret: 'another-secret-that-is-at-least-32-chars' })],
    ['unexpected algorithm (HS512)', () => signToken({}, { algorithm: 'HS512' })],
    ['unsigned "none" algorithm', unsignedToken],
    ['wrong issuer', () => signToken({ iss: 'someone-else' })],
    ['wrong audience', () => signToken({ aud: 'another-api' })],
    ['missing subject', () => signToken({ sub: undefined })],
  ])('rejects an invalid token (%s)', async (_case, makeToken) => {
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_token');
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it('rejects an expired token with a distinct error code', async () => {
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken()}`);

    expect(res.status).toBe(401);
    expect(res.headers['www-authenticate']).toBe('Bearer error="invalid_token"');
    expect(res.body.error.code).toBe('token_expired');
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it('passes a valid token through exactly once and exposes its claims', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${signToken({})}`);

    expect(res.status).toBe(200);
    expect(res.body.auth.sub).toBe(TEST_ENV.DEMO_USERNAME);
    expect(protectedHandler).toHaveBeenCalledTimes(1);
  });

  it('accepts a case-insensitive scheme', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `bearer ${signToken({})}`);

    expect(res.status).toBe(200);
    expect(protectedHandler).toHaveBeenCalledTimes(1);
  });
});

function tamper(token: string): string {
  const [header = '', payload = '', signature = ''] = token.split('.');
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>;
  const forged = Buffer.from(JSON.stringify({ ...claims, sub: 'admin' })).toString('base64url');
  return [header, forged, signature].join('.');
}
