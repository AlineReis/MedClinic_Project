import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";
import { AppointmentRepository } from "../repository/appointment.repository.js";
import { AvailabilityRepository } from "../repository/availability.repository.js";
import { CommissionRepository } from "../repository/commission.repository.js";
import { ProfessionalRepository } from "../repository/professional.repository.js";
import { UserRepository } from "../repository/user.repository.js";
import { MonthlyReportRepository } from "../repository/monthly-report.repository.js";
import { ProfessionalService } from "../services/professional.service.js";
import { Router } from "express";
import { ProfessionalController } from "../controller/professional.controller.js";

const router = Router();

const usersRepository = new UserRepository();
const availabilityRepository = new AvailabilityRepository();
const professionalRepository = new ProfessionalRepository();
const commissionRepository = new CommissionRepository();
const appointmentRepository = new AppointmentRepository();
const monthlyReportRepository = new MonthlyReportRepository();

const professionalService = new ProfessionalService(
  usersRepository,
  professionalRepository,
  availabilityRepository,
  appointmentRepository,
  commissionRepository,
  monthlyReportRepository,
);
const professionalController = new ProfessionalController(professionalService);

router.post("/", professionalController.register);
// Rota de listagem com filtros (query params: ?specialty=x&name=y&page=1)
router.get("/", professionalController.list);
router.get("/:id/availability", professionalController.getAvailability);
router.post("/:id/availability", professionalController.createAvailability);
router.get(
  "/:id/commissions",
  authMiddleware,
  professionalController.listCommissions,
);

// RN-28: Monthly commission reports
router.get(
  "/:id/reports/monthly",
  authMiddleware,
  professionalController.getMonthlyReports,
);

router.post(
  "/:id/reports/monthly/generate",
  authMiddleware,
  roleMiddleware(["clinic_admin", "system_admin"]),
  professionalController.generateMonthlyReport,
);

router.patch(
  "/:id/reports/:report_id/mark-paid",
  authMiddleware,
  roleMiddleware(["clinic_admin", "system_admin"]),
  professionalController.markReportAsPaid,
);

export { router as professionalRoutes };
