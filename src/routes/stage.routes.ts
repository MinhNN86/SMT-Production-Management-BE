/**
 * Stage Routes
 * Định nghĩa các endpoint cho khâu sản xuất.
 *
 * POST   /api/stages                         - Tạo khâu sản xuất mới
 * GET    /api/stages                         - Lấy danh sách khâu sản xuất
 * GET    /api/stages?tree=true               - Lấy cây khâu sản xuất cha-con
 * GET    /api/stages/:id                     - Lấy chi tiết 1 khâu sản xuất
 * GET    /api/stages/device-type/:deviceTypeId - Lấy cây khâu sản xuất theo loại thiết bị
 * PUT    /api/stages/:id                     - Cập nhật khâu sản xuất
 * DELETE /api/stages/:id                     - Xóa khâu sản xuất
 */
import { Router } from "express";
import * as controller from "../controllers/stage.controller.js";
import { authenticate, authorizeRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", authorizeRole, controller.create);
router.get("/", authorizeRole, controller.getAll);
router.get("/:id", authorizeRole, controller.getById);
router.get("/device-type/:deviceTypeId", authorizeRole, controller.getByDeviceType);
router.put("/:id", authorizeRole, controller.update);
router.delete("/:id", authorizeRole, controller.remove);

export default router;
