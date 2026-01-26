import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { CreateUserPayload } from "../models/user.js";
import type { AuthService } from "../services/auth.service.js";
import { UserRepository } from "../repository/user.repository.js";
import { SecurityUtils } from "../utils/security.js";
import { AuthError, ValidationError } from "../utils/errors.js";

export class AuthController {
  private userRepository: UserRepository;

  constructor(private authService: AuthService) {
    this.userRepository = new UserRepository();
  }

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

      if (!email || !password) {
        throw new ValidationError("Email and password are required");
      }

      const user = await this.userRepository.findByEmail(email);

      if (!user) {
        throw new AuthError("Invalid credentials");
      }

      const isPasswordValid = await SecurityUtils.comparePassword(
        password,
        user.password,
      );

      if (!isPasswordValid) {
        throw new AuthError("Invalid credentials");
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: (process.env.JWT_EXPIRES_IN || "24h") as any },
      );

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

  public getProfile = (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.user será preenchido pelo authMiddleware
      const user = req.user;

      if (!user) {
        throw new AuthError("User not authenticated");
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(error);
    }
  };
}
