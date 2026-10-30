export interface ErrorDetail {
  path: string;
  message: string;
}

/** An error that is safe to expose to API clients. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: ErrorDetail[],
    readonly headers: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class ValidationError extends HttpError {
  constructor(details: ErrorDetail[]) {
    super(400, 'validation_error', 'Request validation failed', details);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(code: string, message: string) {
    // RFC 6750: requests without a token get a bare challenge; bad tokens get error="invalid_token".
    const challenge = code === 'missing_token' ? 'Bearer' : 'Bearer error="invalid_token"';
    super(401, code, message, undefined, { 'WWW-Authenticate': challenge });
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Resource not found') {
    super(404, 'not_found', message);
  }
}
