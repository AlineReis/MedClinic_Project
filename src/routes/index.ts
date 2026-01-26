import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { professionalRoutes } from "./professional.routes.js";
import { userRoutes } from "./users.routes.js";
import { appointmentRoutes } from "./appointment.routes.js";

const router = Router();

router.use("/api/v1/:clinic_id/auth", authRoutes);
router.use("/api/v1/:clinic_id/users", userRoutes);
router.use("/api/v1/:clinic_id/appointments", appointmentRoutes);
router.use("/api/v1/:clinic_id/professionals", professionalRoutes);


export default router;
