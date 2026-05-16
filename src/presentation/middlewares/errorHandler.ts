import { Request, Response, NextFunction } from 'express';
import DomainError from '@domain/errors/DomainError';
import logger from '@shared/logger';

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    const status = resolveHttpStatus(err.errorCode);
    res.status(status).json({
      error_code: err.errorCode,
      error_description: err.message,
    });
    return;
  }

  logger.error({ err }, 'Erro interno não tratado');
  res.status(500).json({
    error_code: 'SERVER_ERROR',
    error_description: 'Erro interno do servidor',
  });
}

function resolveHttpStatus(errorCode: string): number {
  const statusMap: Record<string, number> = {
    DOUBLE_REPORT: 409,
    CONFIRMATION_DUPLICATE: 409,
    MEASURE_NOT_FOUND: 404,
    MEASURES_NOT_FOUND: 404,
    INVALID_DATA: 400,
    UNAUTHORIZED: 401,
  };

  return statusMap[errorCode] ?? 500;
}

export default errorHandler;
