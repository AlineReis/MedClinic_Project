import { AppointmentRepository } from "@repositories/appointment.repository.js";
import { PrescriptionRepository } from "@repositories/prescription.repository.js";
import { PrescriptionService } from "@services/prescription.service.js";
import { Router } from "express";
import { PrescriptionController } from "../controller/prescription.controller.js";

const prescriptionRoutes = Router();

// Auth and clinic context middlewares are applied globally in routes/index.ts

const appointmentRepository = new AppointmentRepository();
const prescriptionRepository = new PrescriptionRepository();
const prescriptionService = new PrescriptionService(
  prescriptionRepository,
  appointmentRepository,
);
const prescriptionController = new PrescriptionController(prescriptionService);

prescriptionRoutes.post("/", prescriptionController.create);
prescriptionRoutes.get("/", prescriptionController.list);
prescriptionRoutes.get("/:id", prescriptionController.getById);

export { prescriptionRoutes };
