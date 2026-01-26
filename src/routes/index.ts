import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { userRoutes } from "./users.routes.js";

const router = Router();

router.use("/api/v1/:clinic_id/auth", authRoutes);
router.use("/api/v1/:clinic_id/users", userRoutes);

export default router;
