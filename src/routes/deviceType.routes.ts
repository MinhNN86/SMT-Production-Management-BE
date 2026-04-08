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

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
