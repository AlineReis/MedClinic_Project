import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: (err as any).code || "APP_ERROR",
        message: err.message,
        field: err.field,
      },
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "JSON_PARSE_ERROR",
        message: "Invalid JSON payload",
      },
    });
  }

  console.error("Unhandled Error:", err);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal Server Error",
    },
  });
};
