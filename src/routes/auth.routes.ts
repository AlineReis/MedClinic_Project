import { Router } from "express";
import { AuthController } from "../controller/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { UserRepository } from "../repository/user.repository.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/profile", authMiddleware, authController.getProfile);

export { router as authRoutes };
