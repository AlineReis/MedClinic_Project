import { AppointmentRepository } from "@repositories/appointment.repository.js";
import { AvailabilityRepository } from "@repositories/availability.repository.js";
import { CommissionRepository } from "@repositories/commission.repository.js";
import { ProfessionalRepository } from "@repositories/professional.repository.js";
import { UserRepository } from "@repositories/user.repository.js";
import { ProfessionalService } from "@services/professional.service.js";
import { Router } from "express";
import { ProfessionalController } from "../controller/professional.controller.js";

const router = Router();

const usersRepository = new UserRepository();
const availabilityRepository = new AvailabilityRepository();
const professionalRepository = new ProfessionalRepository();
const commissionRepository = new CommissionRepository();
// Need Appointment Repository now
const appointmentRepository = new AppointmentRepository();

const professionalService = new ProfessionalService(
  usersRepository,
  professionalRepository,
  availabilityRepository,
  appointmentRepository,
  commissionRepository,
);
const professionalController = new ProfessionalController(professionalService);

// Auth and clinic context middlewares are applied globally in routes/index.ts

router.post("/", professionalController.register);
// Rota de listagem com filtros (query params: ?specialty=x&name=y&page=1)
router.get("/", professionalController.list);
router.get("/:id/availability", professionalController.getAvailability);
router.post("/:id/availability", professionalController.createAvailability);
router.get("/:id/commissions", professionalController.listCommissions);

export { router as professionalRoutes };
