/**
 * TeamMember Routes
 *
 * POST   /api/teams/:id/members               - Thêm danh sách worker vào team
 * PUT    /api/teams/:id/members               - Cập nhật toàn bộ danh sách worker của team
 * GET    /api/teams/:id/members               - Danh sách member của team
 * DELETE /api/teams/:id/members/:workerId     - Xóa 1 worker khỏi team
 */
import { Router } from "express";
import * as controller from "../controllers/teamMember.controller.js";

const router = Router({ mergeParams: true });

router.post("/", controller.add);
router.put("/", controller.update);
router.get("/", controller.list);
router.delete("/:workerId", controller.remove);

export default router;
