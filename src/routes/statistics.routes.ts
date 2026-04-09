/**
 * Statistics Routes
 * Định nghĩa endpoint cho thống kê sản lượng.
 *
 * GET /api/statistics?productionOrderId=1&date=2026-03-25  - Thống kê sản lượng
 */
import { Router } from "express";
import * as controller from "../controllers/statistics.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/", authorizeRole, controller.getStatistics);

export default router;
