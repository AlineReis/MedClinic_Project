import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { professionalRoutes } from "./professional.routes.js";
import { userRoutes } from "./users.routes.js";
import { appointmentRoutes } from "./appointment.routes.js";
import { examRoutes } from "./exam.routes.js";
import { prescriptionRoutes } from "./prescription.routes.js";

const router = Router();

router.use("/api/v1/:clinic_id/auth", authRoutes);
router.use("/api/v1/:clinic_id/users", userRoutes);
router.use("/api/v1/:clinic_id/appointments", appointmentRoutes);
router.use("/api/v1/:clinic_id/professionals", professionalRoutes);

router.use("/api/v1/:clinic_id/exams", examRoutes);
router.use("/api/v1/:clinic_id/prescriptions", prescriptionRoutes);

export default router;
