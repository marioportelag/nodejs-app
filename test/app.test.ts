import { pino } from 'pino';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { buildTestApp, buildTestConfig, DEMO_CREDENTIALS } from './helpers.js';

const app = buildTestApp();

describe('public routes and HTTP hardening', () => {
  it('GET /greetings responds publicly', async () => {
    const res = await request(app).get('/greetings');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'greetings' });
  });

  it('GET /health reports liveness', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'not_found', message: 'Route not found' } });
  });

  it('does not advertise the framework and sets security headers', async () => {
    const res = await request(app).get('/greetings');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
  });
});

describe('unexpected errors', () => {
  it('returns a generic 500 and logs the error without leaking details', async () => {
    const logged: unknown[] = [];
    const logger = pino({ level: 'error' }, { write: (line: string) => logged.push(JSON.parse(line)) });
    const failingApp = createApp({
      config: buildTestConfig(),
      logger,
      verifier: { verify: () => Promise.reject(new Error('database connection string leaked here')) },
    });

    const res = await request(failingApp).post('/auth/login').send(DEMO_CREDENTIALS);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: { code: 'internal_error', message: 'An unexpected error occurred' } });
    expect(JSON.stringify(res.body)).not.toContain('leaked');
    expect(logged).toContainEqual(
      expect.objectContaining({
        msg: 'Unhandled error',
        err: expect.objectContaining({ message: expect.stringContaining('leaked') }),
      }),
    );
  });
});
