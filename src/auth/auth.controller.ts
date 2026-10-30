import type { RequestHandler } from 'express';
import { UnauthorizedError } from '../http/errors.js';
import { parseRequest } from '../http/validation.js';
import { loginRequestSchema } from './auth.schemas.js';
import type { CredentialVerifier } from './credentials.js';
import type { TokenService } from './token.service.js';

export function createLoginHandler(verifier: CredentialVerifier, tokenService: TokenService): RequestHandler {
  return async (req, res) => {
    const { username, password } = parseRequest(loginRequestSchema, req.body);

    const principal = await verifier.verify(username, password);
    if (!principal) {
      // Same response for unknown user and wrong password to avoid user enumeration.
      throw new UnauthorizedError('invalid_credentials', 'Invalid username or password');
    }

    const { token, expiresIn } = tokenService.issue(principal.username);

    res.set('Cache-Control', 'no-store').json({ token, tokenType: 'Bearer', expiresIn });
  };
}
