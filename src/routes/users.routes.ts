import { Router } from "express";
import { UserController } from "../controller/user.controller.js";
import { roleMiddleware } from "../middlewares/auth.middleware.js";
import { UserRepository } from "../repository/user.repository.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { UserService } from "../services/user.service.js";

const router = Router({ mergeParams: true });

const userRepository = new UserRepository();
const appointmentRepository = new AppointmentRepository();
const userService = new UserService(userRepository, appointmentRepository);
const userController = new UserController(userService);

// Auth and clinic context middlewares are applied globally in routes/index.ts

router.get(
  "/",
  roleMiddleware(["clinic_admin", "receptionist", "system_admin"]),
  userController.listByClinic,
);
router.get("/:id", userController.getById);
router.put("/:id", userController.update);

router.delete(
  "/:id",
  roleMiddleware(["clinic_admin", "system_admin"]),
  userController.delete_User,
);

// Phase 5: Create user by admin
router.post(
  "/",
  roleMiddleware(["clinic_admin", "system_admin"]),
  userController.create,
);

export { router as userRoutes };
