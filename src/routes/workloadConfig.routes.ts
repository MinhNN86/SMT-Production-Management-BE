/**
 * WorkloadConfig Routes
 * Định nghĩa các endpoint cho cấu hình định mức.
 *
 * POST   /api/workload-configs      - Tạo cấu hình định mức mới
 * GET    /api/workload-configs      - Lấy danh sách cấu hình
 * GET    /api/workload-configs/:id  - Lấy chi tiết 1 cấu hình
 * PUT    /api/workload-configs/:id  - Cập nhật cấu hình
 * DELETE /api/workload-configs/:id  - Xóa cấu hình
 */
import { Router } from "express";
import * as controller from "../controllers/workloadConfig.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
