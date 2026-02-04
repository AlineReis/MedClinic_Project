import { Router } from "express";
import { ReportController } from "../controller/report.controller.js"; // Note .js extension
import { ReportService } from "../services/report.service.js";
import { AppointmentRepository } from "@repositories/appointment.repository.js";

const reportRoutes = Router();

const appointmentRepository = new AppointmentRepository();
const reportService = new ReportService(appointmentRepository);
const reportController = new ReportController(reportService);

reportRoutes.post("/financial/email", reportController.sendFinancialReport);

export { reportRoutes };
