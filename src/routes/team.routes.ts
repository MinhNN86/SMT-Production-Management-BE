/**
 * Team Routes
 *
 * POST   /api/teams      - Tạo team mới
 * GET    /api/teams      - Lấy danh sách team
 * GET    /api/teams/:id  - Lấy chi tiết 1 team
 * PUT    /api/teams/:id  - Cập nhật team
 * DELETE /api/teams/:id  - Xóa team
 */
import { Router } from "express";
import * as controller from "../controllers/team.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
