/**
 * Statistics Routes
 * Định nghĩa endpoint cho thống kê sản lượng.
 *
 * GET /api/statistics?productionOrderId=1&date=2026-03-25  - Thống kê sản lượng
 */
import { Router } from "express";
import * as controller from "../controllers/statistics.controller.js";

const router = Router();

router.get("/", controller.getStatistics);

export default router;
