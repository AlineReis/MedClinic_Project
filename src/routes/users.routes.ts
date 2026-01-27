import { Router } from "express";
import { UserController } from "../controller/user.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";
import { UserRepository } from "../repository/user.repository.js";
import { UserService } from "../services/user.service.js";

const router = Router();

const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

/**
 * GET /api/v1/:clinic_id/users
 * Apenas clinic_admin, receptionist e system_admin
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["clinic_admin", "receptionist", "system_admin"]),
  userController.listByClinic,
);
router.get("/:id", authMiddleware, userController.getUser);

router.put("/:id", authMiddleware, userController.update);

export { router as userRoutes };
