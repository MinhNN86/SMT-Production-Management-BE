/**
 * Shift Routes
 * Định nghĩa các endpoint cho ca làm việc.
 *
 * POST   /api/shifts      - Tạo ca làm việc mới
 * GET    /api/shifts      - Lấy danh sách ca làm việc
 * GET    /api/shifts/:id  - Lấy chi tiết 1 ca làm việc
 * PUT    /api/shifts/:id  - Cập nhật ca làm việc
 * DELETE /api/shifts/:id  - Xóa ca làm việc
 */
import { Router } from "express";
import * as controller from "../controllers/shift.controller.js";

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
