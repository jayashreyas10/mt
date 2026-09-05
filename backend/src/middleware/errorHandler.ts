import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Never log passwords or secrets
  console.error('[Application Error]:', err.message || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(status).json({
    error: message,
    ...(config.env === 'development' ? { stack: err.stack } : {}),
  });
}
