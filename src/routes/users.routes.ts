import { Router } from "express";
import { UserController } from "../controller/user.controller.js";
import {
  authMiddleware,
  roleMiddleware,
} from "../middlewares/auth.middleware.js";
import { UserRepository } from "../repository/user.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { UserService } from "../services/user.service.js";

const router = Router();

const userRepository = new UserRepository();
const appointmentRepository = new AppointmentRepository();
const userService = new UserService(userRepository, appointmentRepository);
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
router.get("/:id", authMiddleware, userController.getById);


router.put("/:id", authMiddleware, userController.update);

export { router as userRoutes };
