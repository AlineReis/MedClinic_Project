import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { professionalRoutes } from "./professional.routes.js";
import { userRoutes } from "./users.routes.js";
import { appointmentRoutes } from "./appointment.routes.js";
import { examRoutes } from "./exam.routes.js";
import { prescriptionRoutes } from "./prescription.routes.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { clinicContextMiddleware } from "../middlewares/clinicContext.middleware.js";

const router = Router();

// Auth routes don't need clinic context (users not authenticated yet)
router.use("/api/v1/:clinic_id/auth", authRoutes);

// Apply auth + clinic context middleware to all protected routes
router.use("/api/v1/:clinic_id/users", authMiddleware, clinicContextMiddleware, userRoutes);
router.use("/api/v1/:clinic_id/appointments", authMiddleware, clinicContextMiddleware, appointmentRoutes);
router.use("/api/v1/:clinic_id/professionals", authMiddleware, clinicContextMiddleware, professionalRoutes);
router.use("/api/v1/:clinic_id/exams", authMiddleware, clinicContextMiddleware, examRoutes);
router.use("/api/v1/:clinic_id/prescriptions", authMiddleware, clinicContextMiddleware, prescriptionRoutes);

export default router;
