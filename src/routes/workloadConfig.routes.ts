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

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
