import { Router } from "express";
import {
  postRequest,
  getAllRequestsByDistance,
  getAllRequestsByCompleterid,
  getMyOpenRequests,
  wantToHelp,
  markRequestCompleted,
  getMyCompletedRequests,
} from "../controllers/requestController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/requests  (must be logged in)
router.post("/", authenticateToken, postRequest);

// GET /api/requests/nearby  (PUBLIC: anyone can see nearby open requests)
router.get("/nearby", getAllRequestsByDistance);

// LEFT SIDE (My Account): requests I created that are still open
router.get("/my-open", authenticateToken, getMyOpenRequests);

// NEW: requests I created that are completed
router.get("/my-completed", authenticateToken, getMyCompletedRequests);

// RIGHT SIDE (My Account): requests I solved for others
router.get("/i-solved", authenticateToken, getAllRequestsByCompleterid);

// "I want to help" (helper claims the request)
router.patch("/:id/help", authenticateToken, wantToHelp);

// "Completed" (creator confirms completion, gives helper stars)
router.patch("/:id/complete", authenticateToken, markRequestCompleted);

export default router;
