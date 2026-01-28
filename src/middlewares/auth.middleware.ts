import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthError, ForbiddenError } from "../utils/errors.js";
import type { UserRole } from "../models/user.js";

import type { AuthResult } from "../models/user.js";

// Extender o tipo Request do Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: AuthResult;
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AuthError("Not authorized, no token"));
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret",
    );
    req.user = decoded as AuthResult;
    next();
  } catch (error) {
    return next(new AuthError("Not authorized, invalid token"));
  }
};

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError("Forbidden: Insufficient permissions"));
    }
    next();
  };
};
