/**
 * User Routes
 * Định nghĩa các endpoint cho nhân viên.
 *
 * POST   /api/users      - Tạo nhân viên mới (chỉ SYSTEM_ADMIN)
 * GET    /api/users      - Lấy danh sách nhân viên (tất cả)
 * GET    /api/users/:id  - Lấy chi tiết 1 nhân viên (tất cả)
 * PUT    /api/users/:id  - Cập nhật nhân viên (SYSTEM_ADMIN, hoặc ADMIN cập nhật chính mình)
 * DELETE /api/users/:id  - Xóa nhân viên (chỉ SYSTEM_ADMIN)
 */
import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { authenticate, authorizeUserManagement } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeUserManagement, controller.create);
router.get("/", authorizeUserManagement, controller.getAll);
router.get("/:id", authorizeUserManagement, controller.getById);
router.put("/:id", authorizeUserManagement, controller.update);
router.delete("/:id", authorizeUserManagement, controller.remove);

export default router;
