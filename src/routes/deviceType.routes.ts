/**
 * DeviceType Routes
 *
 * POST   /api/device-types      - Tạo loại thiết bị mới
 * GET    /api/device-types      - Lấy danh sách loại thiết bị
 * GET    /api/device-types/:id  - Lấy chi tiết 1 loại thiết bị
 * PUT    /api/device-types/:id  - Cập nhật loại thiết bị
 * DELETE /api/device-types/:id  - Xóa loại thiết bị
 */
import { Router } from "express";
import * as controller from "../controllers/deviceType.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
