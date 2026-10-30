import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userStore } from '../src/users/user.store.js';
import { buildTestApp, DEMO_CREDENTIALS, expiredToken, signToken } from './helpers.js';

const app = buildTestApp();

async function login(): Promise<string> {
  const res = await request(app).post('/auth/login').send(DEMO_CREDENTIALS);
  return res.body.token as string;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('protected /users routes', () => {
  it('lists users for a token obtained through /auth/login', async () => {
    const token = await login();
    const res = await request(app).get('/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 25, name: 'camilo', age: 28 },
      { id: 26, name: 'juan', age: 32 },
    ]);
  });

  it('returns a single user by id', async () => {
    const res = await request(app)
      .get('/users/25')
      .set('Authorization', `Bearer ${await login()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 25, name: 'camilo', age: 28 });
  });

  it('returns 404 for an unknown user', async () => {
    const res = await request(app)
      .get('/users/999')
      .set('Authorization', `Bearer ${await login()}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it.each(['abc', '25abc', '-1', '0', '1.5'])('rejects a non-positive-integer id (%s)', async (id) => {
    const res = await request(app)
      .get(`/users/${id}`)
      .set('Authorization', `Bearer ${await login()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it.each([
    ['missing JWT', undefined, 'missing_token'],
    ['malformed JWT', 'Bearer not-a-jwt', 'invalid_token'],
    [
      'forged JWT',
      `Bearer ${signToken({}, { secret: 'attacker-controlled-secret-0123456789' })}`,
      'invalid_token',
    ],
    ['expired JWT', `Bearer ${expiredToken()}`, 'token_expired'],
  ])('rejects %s without running the protected handler', async (_case, header, code) => {
    const findAll = vi.spyOn(userStore, 'findAll');
    const findById = vi.spyOn(userStore, 'findById');

    for (const path of ['/users', '/users/25']) {
      const req = request(app).get(path);
      const res = await (header ? req.set('Authorization', header) : req);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(code);
    }

    expect(findAll).not.toHaveBeenCalled();
    expect(findById).not.toHaveBeenCalled();
  });
});
