/**
 * Stage Routes
 * Định nghĩa các endpoint cho khâu sản xuất.
 *
 * POST   /api/stages                         - Tạo khâu sản xuất mới
 * GET    /api/stages                         - Lấy danh sách khâu sản xuất
 * GET    /api/stages?tree=true               - Lấy cây khâu sản xuất cha-con (kèm autoCalculatedConfigs)
 * GET    /api/stages/:id                     - Lấy chi tiết 1 khâu sản xuất
 * GET    /api/stages/device-type/:deviceTypeId - Lấy cây khâu sản xuất theo loại thiết bị
 * PUT    /api/stages/:id                     - Cập nhật khâu sản xuất
 * DELETE /api/stages/:id                     - Xóa khâu sản xuất
 */
import { Router } from "express";
import * as controller from "../controllers/stage.controller.js";

const router = Router();

router.post("/", controller.create);
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.get("/device-type/:deviceTypeId", controller.getByDeviceType);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

export default router;
