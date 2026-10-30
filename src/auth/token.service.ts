import jwt from 'jsonwebtoken';
import type { JwtConfig } from '../config/env.js';
import { UnauthorizedError } from '../http/errors.js';

/** The only signing algorithm this service issues or accepts. */
export const JWT_ALGORITHM = 'HS256';

export interface AccessTokenClaims {
  sub: string;
  iat: number;
  exp: number;
}

export interface IssuedToken {
  token: string;
  expiresIn: number;
}

export class TokenService {
  constructor(private readonly config: JwtConfig) {}

  issue(subject: string): IssuedToken {
    const token = jwt.sign({}, this.config.secret, {
      algorithm: JWT_ALGORITHM,
      subject,
      issuer: this.config.issuer,
      audience: this.config.audience,
      expiresIn: this.config.expiresInSeconds,
    });

    return { token, expiresIn: this.config.expiresInSeconds };
  }

  /**
   * Verifies signature, algorithm, issuer, audience and expiry.
   * @throws UnauthorizedError when the token is not acceptable.
   */
  verify(token: string): AccessTokenClaims {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, this.config.secret, {
        algorithms: [JWT_ALGORITHM],
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('token_expired', 'Access token has expired');
      }
      throw new UnauthorizedError('invalid_token', 'Access token is invalid');
    }

    if (
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number'
    ) {
      throw new UnauthorizedError('invalid_token', 'Access token is invalid');
    }

    return { sub: payload.sub, iat: payload.iat, exp: payload.exp };
  }
}
