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

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["clinic_admin", "receptionist", "system_admin"]),
  userController.listByClinic,
);
router.get("/:id", authMiddleware, userController.getById);
router.put("/:id", authMiddleware, userController.update);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["clinic_admin", "system_admin"]),
  userController.delete_User,
);

export { router as userRoutes };
