import { Router } from "express";
import { getUserRequestActivityChart } from "../controllers/GraphController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/user-activity", authenticateToken, getUserRequestActivityChart);

export default router;
