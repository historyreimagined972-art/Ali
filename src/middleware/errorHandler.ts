import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;
  fields?: Record<string, string[]>;

  constructor(message: string, statusCode: number, code: string, fields?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  error: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', error.message, error.stack);

  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        fields,
      },
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields && { fields: error.fields }),
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
