import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildTestApp, DEMO_CREDENTIALS, TEST_ENV } from './helpers.js';

const app = buildTestApp();

describe('POST /auth/login', () => {
  it('issues a signed, short-lived HS256 token for valid credentials', async () => {
    const res = await request(app).post('/auth/login').send(DEMO_CREDENTIALS);

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ token: expect.any(String), tokenType: 'Bearer', expiresIn: 900 });

    const decoded = jwt.verify(res.body.token, TEST_ENV.JWT_SECRET, { complete: true });
    expect(decoded.header.alg).toBe('HS256');
    expect(decoded.payload).toMatchObject({
      sub: DEMO_CREDENTIALS.username,
      iss: TEST_ENV.JWT_ISSUER,
      aud: TEST_ENV.JWT_AUDIENCE,
    });
    const { iat, exp } = decoded.payload as jwt.JwtPayload;
    expect(exp! - iat!).toBe(900);
  });

  it.each([
    ['wrong password', { username: DEMO_CREDENTIALS.username, password: 'not-the-password' }],
    ['unknown user', { username: 'someone-else', password: DEMO_CREDENTIALS.password }],
  ])('rejects invalid credentials (%s) with a generic 401', async (_case, body) => {
    const res = await request(app).post('/auth/login').send(body);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: 'invalid_credentials', message: 'Invalid username or password' },
    });
    expect(res.body.token).toBeUndefined();
  });

  it('rejects missing credentials with field-level details', async () => {
    const res = await request(app).post('/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details.map((d: { path: string }) => d.path).sort()).toEqual([
      'password',
      'username',
    ]);
  });

  it('rejects a request without a body', async () => {
    const res = await request(app).post('/auth/login');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it.each([
    ['non-string fields', { username: 123, password: ['x'] }],
    ['blank username', { username: '   ', password: 'secret-value' }],
    ['unexpected fields', { ...DEMO_CREDENTIALS, role: 'admin' }],
    ['array payload', [DEMO_CREDENTIALS]],
  ])('rejects an invalid payload (%s)', async (_case, body) => {
    const res = await request(app).post('/auth/login').send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('rejects malformed JSON without leaking parser internals', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username": "demo",');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'invalid_json', message: 'Request body must be valid JSON' } });
    expect(JSON.stringify(res.body)).not.toMatch(/SyntaxError|at JSON|node_modules/);
  });

  it('rejects oversized payloads', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'demo', password: 'x'.repeat(20_000) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('payload_too_large');
  });

  it('rate-limits repeated login attempts', async () => {
    const limitedApp = buildTestApp({ LOGIN_RATE_LIMIT_MAX: '2' });
    const attempt = () => request(limitedApp).post('/auth/login').send({ username: 'x', password: 'y' });

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);

    const limited = await attempt();
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('too_many_requests');
  });
});
