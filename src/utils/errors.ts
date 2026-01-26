export abstract class AppError extends Error {
  public abstract statusCode: number;
  public field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = this.constructor.name;
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public statusCode = 400;
  public code = "VALIDATION_ERROR";

  constructor(message: string, field?: string) {
    super(message, field);
  }
}

export class AuthError extends AppError {
  public statusCode = 401;
  public code = "AUTH_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends AppError {
  public statusCode = 403;
  public code = "FORBIDDEN_ERROR";

  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  public statusCode = 404;
  public code = "NOT_FOUND_ERROR";

  constructor(message: string) {
    super(message);
  }
}
