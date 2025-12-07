import { Router } from "express";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  listUsers,
  banUser,
  unbanUser,
  deleteUserAdmin,
  listRequests,
  deleteRequestAdmin,
} from "../controllers/adminController.js";

const router = Router();

router.use(authenticateToken, isAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.delete("/users/:id", deleteUserAdmin);

router.get("/requests", listRequests);
router.delete("/requests/:id", deleteRequestAdmin);

export default router;
