/**
 * ProductionOrder Routes
 * Định nghĩa các endpoint cho lệnh sản xuất.
 *
 * POST   /api/production-orders                   - Tạo lệnh sản xuất mới
 * GET    /api/production-orders                   - Lấy danh sách lệnh sản xuất
 * GET    /api/production-orders/:id               - Lấy chi tiết 1 lệnh sản xuất
 * PUT    /api/production-orders/:id               - Cập nhật lệnh sản xuất
 * DELETE /api/production-orders/:id               - Xóa lệnh sản xuất
 * GET    /api/production-orders/:id/production-logs - Lấy danh sách nhật ký sản xuất của lệnh sản xuất
 */
import { Router } from "express";
import * as controller from "../controllers/productionOrder.controller.js";

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);
router.get("/:id/production-logs", controller.getProductionLogs);
router.post("/:id/production-logs", controller.filterProductionLogs);

export default router;
