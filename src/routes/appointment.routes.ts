import { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller.js";
import { AppointmentService } from "../services/appointment.service.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Injeção de dependência manual (idealmente usaríamos um container)
const appointmentRepository = new AppointmentRepository();
const appointmentService = new AppointmentService(appointmentRepository);
const appointmentController = new AppointmentController(appointmentService);

router.use(authMiddleware); // Todas as rotas de agendamento requerem autenticação

router.post("/", appointmentController.schedule);
router.get("/patient/:id", appointmentController.listPatientAppointments);
router.get("/professional/:id", appointmentController.listProfessionalAgenda);
router.get("/:id", appointmentController.getById);
router.patch("/:id/confirm", appointmentController.confirm);
router.post("/:id/cancel", appointmentController.cancel);

export { router as appointmentRoutes };
