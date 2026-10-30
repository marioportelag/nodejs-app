import { z } from 'zod';

/** Rejects values copied verbatim from .env.example. */
const notPlaceholder = (value: string) => !/replace-with/i.test(value);
const PLACEHOLDER_MESSAGE = 'must be changed from the .env.example placeholder';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),

  JWT_SECRET: z
    .string()
    .min(32, 'must be at least 32 characters')
    .refine(notPlaceholder, PLACEHOLDER_MESSAGE),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).max(86_400).default(900),
  JWT_ISSUER: z.string().min(1).default('nodejs-app'),
  JWT_AUDIENCE: z.string().min(1).default('nodejs-app-api'),

  DEMO_USERNAME: z.string().trim().min(1).max(128),
  DEMO_PASSWORD: z
    .string()
    .min(12, 'must be at least 12 characters')
    .max(256)
    .refine(notPlaceholder, PLACEHOLDER_MESSAGE),

  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  LOGIN_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .default(15 * 60 * 1_000),
});

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
  issuer: string;
  audience: string;
}

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  port: number;
  logLevel: string;
  trustProxy: number;
  jwt: JwtConfig;
  demoAuth: { username: string; password: string };
  loginRateLimit: { max: number; windowMs: number };
}

export class ConfigError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`);
    this.name = 'ConfigError';
  }
}

/**
 * Parses and validates configuration from environment variables.
 * Fails fast with a list of invalid variable names; values are never echoed back.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`),
    );
  }

  const vars = result.data;

  return {
    env: vars.NODE_ENV,
    port: vars.PORT,
    logLevel: vars.LOG_LEVEL,
    trustProxy: vars.TRUST_PROXY,
    jwt: {
      secret: vars.JWT_SECRET,
      expiresInSeconds: vars.JWT_EXPIRES_IN_SECONDS,
      issuer: vars.JWT_ISSUER,
      audience: vars.JWT_AUDIENCE,
    },
    demoAuth: { username: vars.DEMO_USERNAME, password: vars.DEMO_PASSWORD },
    loginRateLimit: { max: vars.LOGIN_RATE_LIMIT_MAX, windowMs: vars.LOGIN_RATE_LIMIT_WINDOW_MS },
  };
}
