import { createHash, timingSafeEqual } from 'node:crypto';

export interface AuthenticatedPrincipal {
  username: string;
}

/**
 * Verifies a username/password pair. The login flow depends only on this
 * interface, so the demo implementation below can be replaced by a real
 * user store without touching routes, controllers or token handling.
 */
export interface CredentialVerifier {
  verify(username: string, password: string): Promise<AuthenticatedPrincipal | null>;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Constant-time string comparison (hashing first equalises input lengths). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * DEMO ONLY: a single account whose credentials are supplied through
 * environment variables. There is no user database, password hashing,
 * lockout or account management. See README "Known limitations".
 */
export class DemoCredentialVerifier implements CredentialVerifier {
  constructor(private readonly account: { username: string; password: string }) {}

  verify(username: string, password: string): Promise<AuthenticatedPrincipal | null> {
    // Evaluate both comparisons so timing does not reveal which field was wrong.
    const usernameMatches = safeEqual(username, this.account.username);
    const passwordMatches = safeEqual(password, this.account.password);

    return Promise.resolve(usernameMatches && passwordMatches ? { username: this.account.username } : null);
  }
}
