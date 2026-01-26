import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { professionalRoutes } from "./professional.routes.js";

const router = Router();

router.use("/api/v1/:clinic_id/auth", authRoutes);
router.use("/api/v1/:clinic_id/professionals", professionalRoutes);

export default router;
