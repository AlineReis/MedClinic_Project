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
