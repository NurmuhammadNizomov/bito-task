import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        messageKey: 'error.validation',
        errors: parsed.error.flatten().fieldErrors,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}
