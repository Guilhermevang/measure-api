import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de autenticação por API Key.
 * Se a variável API_KEY não estiver definida, a verificação é ignorada
 * (útil para desenvolvimento local sem configuração de segurança).
 */
function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env.API_KEY;

  if (!expectedKey) {
    next();
    return;
  }

  const providedKey = req.headers['x-api-key'];

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({
      error_code: 'UNAUTHORIZED',
      error_description: 'API Key ausente ou inválida',
    });
    return;
  }

  next();
}

export default apiKeyAuth;
