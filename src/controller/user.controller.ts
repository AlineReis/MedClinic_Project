import type { NextFunction, Request, Response } from "express";
import type { UserService } from "../services/user.service.js";
import { AuthError, ValidationError } from "../utils/errors.js";
import { isValidId } from "../utils/validators.js";

export class UserController {
  constructor(private userService: UserService) { }

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
        throw new AuthError();
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
          role: (req.query.role === "all" ? undefined : req.query.role) as
            | string
            | undefined,
          search: search as string,
          page: page ? Number(page) : 1, // Converte string para número
          pageSize: pageSize ? Number(pageSize) : 10, // Converte string para número
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
    //(próprio usuário pode atualizar nome/email)
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
        throw new AuthError();
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
        throw new AuthError();
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

  /**
   * Phase 5: POST /api/v1/:clinic_id/users
   * Create user by admin
   */
  public create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clinicId = Number(req.params.clinic_id);

      if (!isValidId(clinicId)) {
        throw new ValidationError("clinic_id inválido");
      }

      const requester = req.user;
      if (!requester) {
        throw new AuthError();
      }

      const result = await this.userService.createUserByAdmin({
        clinicId,
        requester: requester as any,
        data: {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          role: req.body.role,
          cpf: req.body.cpf,
          phone: req.body.phone,
        },
      });

      return res.status(201).json({
        success: true,
        user: result.user,
        message:
          "Usuário criado com sucesso. As credenciais foram enviadas para o email cadastrado.",
      });
    } catch (error) {
      return next(error);
    }
  };
}
