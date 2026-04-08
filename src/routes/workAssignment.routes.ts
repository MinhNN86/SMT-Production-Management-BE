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

const router = Router();

router.post("/", controller.create);
router.put("/", controller.update);
router.get("/", controller.getAll);
router.delete("/", controller.remove);

export default router;
