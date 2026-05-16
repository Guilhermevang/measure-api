import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware genérico de validação com Zod.
 * Valida body, params e query conforme o schema informado.
 */
function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message).join('; ');
      res.status(400).json({
        error_code: 'INVALID_DATA',
        error_description: messages,
      });
      return;
    }

    next();
  };
}

export default validate;
