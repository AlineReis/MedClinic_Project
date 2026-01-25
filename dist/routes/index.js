import { Router } from "express";
import { UserController } from "../controller/user.controller.js";
const router = Router();
// USER
router.use(UserController.login);
// DOCTOR
router.use();
// PATIENT
router.use();
export default router;
