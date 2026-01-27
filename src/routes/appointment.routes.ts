import { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller.js";
import { AppointmentService } from "../services/appointment.service.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Injeção de dependência manual (idealmente usaríamos um container)
const appointmentRepository = new AppointmentRepository();
const availabilityRepository = new AvailabilityRepository();
const userRepository = new UserRepository();
const appointmentService = new AppointmentService(appointmentRepository, availabilityRepository, userRepository);
const appointmentController = new AppointmentController(appointmentService);

router.use(authMiddleware); // Todas as rotas de agendamento requerem autenticação

router.post("/", appointmentController.schedule);
router.get("/", appointmentController.list); // Unified list with filters
router.get("/:id", appointmentController.getById);
router.patch("/:id/confirm", appointmentController.confirm);
router.post("/:id/cancel", appointmentController.cancel);

export { router as appointmentRoutes };
