import { AvailabilityRepository } from "@repositories/availability.repository.js";
import { Router } from "express";
import { AppointmentController } from "../controller/appointment.controller.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { TransactionRepository } from "../repository/transaction.repository.js";
import { CommissionSplitRepository } from "../repository/commission-split.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { PaymentMockService } from "../services/payment-mock.service.js";
import { AppointmentService } from "../services/appointment.service.js";
import { ResendEmailService } from "../services/email.service.js";

const router = Router({ mergeParams: true });

// Injeção de dependência manual (idealmente usaríamos um container)
const appointmentRepository = new AppointmentRepository();
const availabilityRepository = new AvailabilityRepository();
const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();
const commissionSplitRepository = new CommissionSplitRepository();

const paymentMockService = new PaymentMockService(transactionRepository, commissionSplitRepository, appointmentRepository);
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

// Phase 5: Appointment workflow endpoints
router.post("/:id/checkin", appointmentController.checkin);
router.post("/:id/start", appointmentController.start);
router.post("/:id/complete", appointmentController.complete);
router.post("/:id/no-show", appointmentController.noShow);

export { router as appointmentRoutes };
