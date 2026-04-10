/**
 * ProductionOrder Routes
 * Định nghĩa các endpoint cho lệnh sản xuất.
 *
 * POST   /api/production-orders                      - Tạo lệnh sản xuất mới
 * GET    /api/production-orders                      - Lấy danh sách lệnh sản xuất
 * GET    /api/production-orders/:id                  - Lấy chi tiết 1 lệnh sản xuất
 * PUT    /api/production-orders/:id                  - Cập nhật lệnh sản xuất
 * DELETE /api/production-orders/:id                  - Xóa lệnh sản xuất
 * GET    /api/production-orders/:id/production-logs  - Lấy danh sách nhật ký sản xuất của lệnh sản xuất
 * POST   /api/production-orders/:id/start            - Bắt đầu sản xuất (PENDING -> IN_PROGRESS)
 * POST   /api/production-orders/:id/pause            - Dừng tạm thời sản xuất (IN_PROGRESS -> PAUSED)
 * POST   /api/production-orders/:id/complete         - Hoàn thành sản xuất (IN_PROGRESS -> COMPLETED)
 */
import { Router } from "express";
import * as controller from "../controllers/productionOrder.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);
router.get("/:id/production-logs", authorizeRole, controller.getProductionLogs);
router.post("/:id/production-logs", authorizeRole, controller.filterProductionLogs);
router.post("/:id/start", authorizeRole, controller.startProduction);
router.post("/:id/pause", authorizeRole, controller.pauseProduction);
router.post("/:id/complete", authorizeRole, controller.completeProduction);

export default router;
