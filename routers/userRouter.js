import { Router } from "express";
import { deleteUser, registerUser, loginUser, getMe, updateProfileImage } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticateToken, getMe);
router.patch("/profile-image", authenticateToken, updateProfileImage);

router.delete("/delete/:id", authenticateToken, deleteUser);

export default router;
