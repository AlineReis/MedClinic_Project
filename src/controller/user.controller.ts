import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../services/user.service.js";
import { AuthError, ValidationError } from "../utils/errors.js";
import { isValidId } from "../utils/validators.js";

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

      const pageNum = Number(page);
      const pageSizeNum = Number(pageSize);
      const parsedPage = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
      const parsedPageSize =
        Number.isFinite(pageSizeNum) && pageSizeNum > 0 ? pageSizeNum : 10;

      const roleFilter =
        typeof role === "string" && role.trim() ? role.trim() : undefined;
      const searchFilter =
        typeof search === "string" && search.trim() ? search.trim() : undefined;

      const users = await this.userService.listUsersByClinic({
        clinicId,
        requester,
        filters: {
          page: parsedPage,
          pageSize: parsedPageSize,
          ...(roleFilter ? { role: roleFilter } : {}),
          ...(searchFilter ? { search: searchFilter } : {}),
        },
      });

      return res.status(200).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(error);
    }
  };

  public update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicId = Number(req.params.clinic_id);
      const targetUserId = Number(req.params.id);

      if (!isValidId(clinicId)) {
        throw new ValidationError("clinic_id inválido");
      }

      if (!isValidId(targetUserId)) {
        throw new ValidationError("id inválido");
      }

      const requester = req.user;
      if (!requester) {
        throw new AuthError("User not authenticated");
      }

      const user = await this.userService.updateUserScoped({
        clinicId,
        requester,
        targetUserId,
        data: req.body,
      });

      return res.status(200).json({
        success: true,
        user,
        message: "Usuário atualizado com sucesso",
      });
    } catch (error) {
      return next(error);
    }
  };

  public delete_User = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const clinicId = Number(req.params.clinic_id);
      const targetUserId = Number(req.params.id);

      if (!isValidId(clinicId)) {
        throw new ValidationError("clinic_id inválido");
      }

      if (!isValidId(targetUserId)) {
        throw new ValidationError("id inválido");
      }

      const requester = req.user;
      if (!requester) {
        throw new AuthError("User not authenticated");
      }

      await this.userService.deleteUser({
        clinicId,
        requester: requester as any,
        targetUserId,
      });

      // 204 sem corpo é padrão para delete
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };
}
