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

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
