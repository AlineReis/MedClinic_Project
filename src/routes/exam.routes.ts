import { Router } from "express";
import { ExamController } from "../controller/exam.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const examRoutes = Router();

examRoutes.use(authMiddleware);

examRoutes.get("/catalog", ExamController.listCatalog);
examRoutes.post("/", ExamController.createRequest);
examRoutes.get("/", ExamController.listRequests);
examRoutes.get("/:id", ExamController.getRequest);

export { examRoutes };
