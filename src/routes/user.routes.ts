/**
 * User Routes
 * Định nghĩa các endpoint cho nhân viên.
 *
 * POST   /api/users      - Tạo nhân viên mới
 * GET    /api/users      - Lấy danh sách nhân viên
 * GET    /api/users/:id  - Lấy chi tiết 1 nhân viên
 * PUT    /api/users/:id  - Cập nhật nhân viên
 * DELETE /api/users/:id  - Xóa nhân viên
 */
import { Router } from "express";
import * as controller from "../controllers/user.controller.js";

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
