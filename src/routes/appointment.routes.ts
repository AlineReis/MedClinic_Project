import { AvailabilityRepository } from "@repositories/availability.repository.js";
import { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { PaymentMockService } from "../services/payment-mock.service.js";
import { AppointmentService } from "../services/appointment.service.js";
import { ResendEmailService } from "../services/email.service.js";

const router = Router();

// Injeção de dependência manual (idealmente usaríamos um container)
const appointmentRepository = new AppointmentRepository();
const availabilityRepository = new AvailabilityRepository();
const userRepository = new UserRepository();

const paymentMockService = new PaymentMockService(appointmentRepository);
const emailService = new ResendEmailService();

const appointmentService = new AppointmentService(appointmentRepository, availabilityRepository, userRepository, paymentMockService, emailService);
const appointmentController = new AppointmentController(appointmentService);

// Auth and clinic context middlewares are applied globally in routes/index.ts

router.post("/", appointmentController.schedule);
router.get("/", appointmentController.list); // Unified list with filters
router.get("/:id", appointmentController.getById);
router.patch("/:id/confirm", appointmentController.confirm);
router.delete("/:id", appointmentController.cancel);
router.post("/:id/reschedule", appointmentController.reschedule);
router.post("/:id/complete", appointmentController.complete);


export { router as appointmentRoutes };
