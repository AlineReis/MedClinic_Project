import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../services/user.service.js";
import { AuthError } from "../utils/errors.js";

export class UserController {
  constructor(private userService: UserService) {}

  /*
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
  */
  public getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicId = Number(req.params.clinic_id);
      const targetUserId = Number(req.params.id);

      const requester = req.user;
      if (!requester) {
        throw new AuthError("User not authenticated");
      }

      const user = await this.userService.getUserByIdScoped({
        clinicId,
        requester,
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

      // req.user vem do authMiddleware (igual no AuthController.getProfile)
      const requester = req.user;
      const { role, search, page, pageSize } = req.query;

      const users = await this.userService.listUsersByClinic({
        clinicId,
        requester,
        filters: {
          role: (req.query.role || 'health_professional') as string,
          search: search as string,
          page: page ? Number(page) : 1,       // Converte string para número
          pageSize: pageSize ? Number(pageSize) : 10 // Converte string para número
          }
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
