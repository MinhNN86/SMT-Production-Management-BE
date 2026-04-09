/**
 * WorkAssignment Routes
 * Định nghĩa các endpoint cho phân công nhân sự.
 *
 * POST   /api/work-assignments      - Tạo phân công mới (kèm validation >= 3 worker)
 * PUT    /api/work-assignments      - Cập nhật danh sách worker cho 1 khâu/ca/ngày
 * GET    /api/work-assignments      - Lấy danh sách phân công (hỗ trợ lọc)
 * DELETE /api/work-assignments      - Xóa phân công (body: productionOrderId, stageId, shiftId, workDate)
 */
import { Router } from "express";
import * as controller from "../controllers/workAssignment.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.put("/", authorizeRole, controller.update);
router.get("/", authorizeRole, controller.getAll);
router.delete("/", authorizeRole, controller.remove);

export default router;
