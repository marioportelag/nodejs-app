import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../src/config/env.js';
import { TEST_ENV } from './helpers.js';

function withoutKey(key: keyof typeof TEST_ENV): Record<string, string> {
  const env: Record<string, string> = { ...TEST_ENV };
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete env[key];
  return env;
}

describe('loadConfig', () => {
  it('parses a valid environment and applies defaults', () => {
    const config = loadConfig({
      JWT_SECRET: TEST_ENV.JWT_SECRET,
      DEMO_USERNAME: 'demo',
      DEMO_PASSWORD: TEST_ENV.DEMO_PASSWORD,
    });

    expect(config).toMatchObject({
      env: 'development',
      port: 3000,
      trustProxy: 0,
      jwt: { expiresInSeconds: 900, issuer: 'nodejs-app', audience: 'nodejs-app-api' },
      loginRateLimit: { max: 10, windowMs: 900_000 },
    });
  });

  it.each(['JWT_SECRET', 'DEMO_USERNAME', 'DEMO_PASSWORD'] as const)(
    'fails fast when %s is missing',
    (key) => {
      expect(() => loadConfig(withoutKey(key))).toThrow(ConfigError);
      expect(() => loadConfig(withoutKey(key))).toThrow(key);
    },
  );

  it('rejects a JWT secret shorter than 32 characters without echoing it', () => {
    const weakSecret = 'too-short-secret';

    try {
      loadConfig({ ...TEST_ENV, JWT_SECRET: weakSecret });
      expect.unreachable('loadConfig should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      expect((error as ConfigError).message).toContain('JWT_SECRET');
      expect((error as ConfigError).message).not.toContain(weakSecret);
    }
  });

  it('rejects the unmodified .env.example placeholders', () => {
    const placeholders = {
      JWT_SECRET: 'replace-with-a-long-random-secret-of-32-chars-or-more',
      DEMO_PASSWORD: 'replace-with-a-strong-demo-password',
    };

    expect(() => loadConfig({ ...TEST_ENV, JWT_SECRET: placeholders.JWT_SECRET })).toThrow('JWT_SECRET');
    expect(() => loadConfig({ ...TEST_ENV, DEMO_PASSWORD: placeholders.DEMO_PASSWORD })).toThrow(
      'DEMO_PASSWORD',
    );
  });

  it('rejects a weak demo password', () => {
    expect(() => loadConfig({ ...TEST_ENV, DEMO_PASSWORD: 'password' })).toThrow('DEMO_PASSWORD');
  });

  it('rejects an out-of-range token lifetime', () => {
    expect(() => loadConfig({ ...TEST_ENV, JWT_EXPIRES_IN_SECONDS: '0' })).toThrow('JWT_EXPIRES_IN_SECONDS');
  });
});
