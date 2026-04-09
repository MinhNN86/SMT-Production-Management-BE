/**
 * ProductionLog Routes
 * Định nghĩa các endpoint cho báo cáo sản lượng.
 *
 * POST   /api/production-logs      - Nhập/cập nhật báo cáo sản lượng (upsert)
 * POST   /api/production-logs/bulk - Nhập hàng loạt báo cáo sản lượng cho các khâu con
 * GET    /api/production-logs      - Lấy danh sách báo cáo (hỗ trợ lọc)
 * PUT    /api/production-logs/:id  - Cập nhật thông tin log theo ID
 * DELETE /api/production-logs/:id  - Xóa báo cáo sản xuất theo ID (xóa cả work_assignments)
 */
import { Router } from "express";
import * as controller from "../controllers/productionLog.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.upsert);
router.post("/bulk", authorizeRole, controller.bulkUpsert);
router.get("/", authorizeRole, controller.getAll);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
