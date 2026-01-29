import type { NextFunction, Request, Response } from "express";
import type { CreateUserPayload } from "../models/user.js";
import type { AuthService } from "../services/auth.service.js";
import { AuthError } from "../utils/errors.js";

export class AuthController {

  constructor(private authService: AuthService) { }

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

  public login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      const { token, user } = await this.authService.login(email, password);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: "strict",
      });

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  public logout = (req: Request, res: Response) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // payload do token (incompleto)
      const jwtPayload = req.user;

      if (!jwtPayload) {
        throw new AuthError("User not authenticated");
      }

      // Buscar perfil atualizado no banco via service
      const user = await this.authService.getProfile(jwtPayload.id);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(error);
    }
  };
}
