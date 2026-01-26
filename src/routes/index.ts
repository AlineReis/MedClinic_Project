import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

// clinic_id tá hard coded no lugar de :clinic_id porque ainda não tem um jeito de registrar clínicas
// e assim é possível já iniciar a aplicação e registrar
router.use("/api/v1/clinic_id", authRoutes);

export default router;
