import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { appointmentRoutes } from "./appointment.routes.js";
import { authRoutes } from "./auth.routes.js";
import { examRoutes } from "./exam.routes.js";
import { prescriptionRoutes } from "./prescription.routes.js";
import { professionalRoutes } from "./professional.routes.js";
import { userRoutes } from "./users.routes.js";
import { reportRoutes } from "./report.routes.js";

const router = Router();

// Auth routes don't need clinic context (users not authenticated yet)
router.use("/api/v1/:clinic_id/auth", authRoutes);

// Apply auth + clinic context middleware to all protected routes
router.use("/api/v1/:clinic_id/users", authMiddleware, userRoutes);
router.use(
  "/api/v1/:clinic_id/appointments",
  authMiddleware,
  appointmentRoutes,
);
router.use(
  "/api/v1/:clinic_id/professionals",
  authMiddleware,
  professionalRoutes,
);
router.use("/api/v1/:clinic_id/exams", authMiddleware, examRoutes);
router.use(
  "/api/v1/:clinic_id/prescriptions",
  authMiddleware,
  prescriptionRoutes,
);
router.use("/api/v1/:clinic_id/reports", authMiddleware, reportRoutes);

export default router;
