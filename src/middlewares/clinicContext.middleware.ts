import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, ValidationError } from "../utils/errors.js";
import { isValidId } from "../utils/validators.js";

/**
 * RN-Phase4: Multi-Tenancy Enforcement Middleware
 *
 * Validates that the clinic_id from route params matches the user's clinic_id
 * Prevents cross-clinic data access
 *
 * Usage: Apply to all routes with /:clinic_id parameter
 */
export const clinicContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const clinicIdParam = req.params.clinic_id;

  // Validate clinic_id format
  if (!clinicIdParam || !isValidId(clinicIdParam)) {
    return next(new ValidationError("Invalid clinic_id in URL", "clinic_id"));
  }

  const clinicId = Number(clinicIdParam);

  // Check if user is authenticated (should be handled by authMiddleware first)
  if (!req.user) {
    return next(new ForbiddenError("Authentication required"));
  }

  // System admins can access any clinic
  if (req.user.role === "system_admin") {
    req.user.requestedClinicId = clinicId;
    return next();
  }

  // Check if user's clinic_id matches the requested clinic_id
  if (req.user.clinic_id !== clinicId) {
    return next(
      new ForbiddenError(
        "Access denied: You cannot access data from a different clinic",
      ),
    );
  }

  // Store the validated clinic_id in request for use in services
  req.user.requestedClinicId = clinicId;

  next();
};
