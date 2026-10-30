import type { ErrorRequestHandler, RequestHandler, Response } from 'express';
import type { Logger } from 'pino';
import { HttpError, NotFoundError } from './errors.js';

function sendError(res: Response, error: HttpError): void {
  res
    .status(error.status)
    .set(error.headers)
    .json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
}

/** Maps errors raised by Express' JSON body parser to client errors. */
function fromBodyParserError(err: unknown): HttpError | undefined {
  const type = (err as { type?: unknown } | null)?.type;

  switch (type) {
    case 'entity.parse.failed':
      return new HttpError(400, 'invalid_json', 'Request body must be valid JSON');
    case 'entity.too.large':
      return new HttpError(413, 'payload_too_large', 'Request body is too large');
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new HttpError(415, 'unsupported_media_type', 'Unsupported request body encoding');
    default:
      return undefined;
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Route not found'));
};

export function createErrorHandler(logger: Logger): ErrorRequestHandler {
  return (err: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const known = err instanceof HttpError ? err : fromBodyParserError(err);

    if (known) {
      sendError(res, known);
      return;
    }

    // Unknown errors are logged in full but never leaked to the client.
    logger.error({ err }, 'Unhandled error');
    sendError(res, new HttpError(500, 'internal_error', 'An unexpected error occurred'));
  };
}
