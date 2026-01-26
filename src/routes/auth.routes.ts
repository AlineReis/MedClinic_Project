import { AuthController } from "@controllers/auth.controller.js";
import { UserRepository } from "@repositories/user.repository.js";
import { AuthService } from "@services/auth.service.js";
import { Router } from "express";

const authRoutes = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

authRoutes.post("/auth/register", authController.register);

export default authRoutes;
