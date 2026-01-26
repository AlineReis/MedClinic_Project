import type { CreateUserPayload } from "@models/user.js";
import type { AuthService } from "@services/auth.service.js";
import type { NextFunction, Request, Response } from "express";

export class AuthController {
  constructor(private authService: AuthService) {}

  public register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = req.body as CreateUserPayload;

      const user = await this.authService.registerPatient(input);

      return res.status(201).json({
        success: true,
        user,
        message: "Usuário registrado com sucesso",
      });
    } catch (error) {
      return next(error);
    }
  };
}
