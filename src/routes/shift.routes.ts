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
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
