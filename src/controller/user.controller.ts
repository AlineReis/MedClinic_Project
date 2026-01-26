import type { UserRole } from "@models/user.js";
import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../services/user.service.js";
import { ValidationError } from "../utils/errors.js";

export class UserController {
  constructor(private userService: UserService) {}

  public getUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const targetUserId = Number(req.params.id);

      const user = await this.userService.getUserById({
        requesterId: req.user?.id ?? 0,
        requesterRole: (req.user?.role as UserRole) ?? "patient",
        targetUserId,
      });

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/v1/:clinic_id/users
   * Lista os usuários de uma clínica específica
   */
  public listByClinic = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const clinicId = Number(req.params.clinic_id);

      if (!Number.isFinite(clinicId) || clinicId <= 0) {
        throw new ValidationError("clinic_id inválido");
      }

      // req.user vem do authMiddleware (igual no AuthController.getProfile)
      const requester = req.user;

      const users = await this.userService.listUsersByClinic({
        clinicId,
        requester,
      });

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(error);
    }
  };
}
