/**
 * Auth Routes
 * Định nghĩa endpoints cho xác thực.
 * Chỉ có endpoint login (không có register - admin tạo user qua /api/workers).
 */
import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// POST /api/auth/login — Đăng nhập, nhận JWT token
router.post("/login", authController.login);

// PUT /api/auth/change-password — Đổi mật khẩu
// - Admin có thể đổi mật khẩu của bất kỳ user nào (cung cấp userId trong body)
// - User chỉ có thể đổi mật khẩu của chính mình (không cần cung cấp userId)
router.put("/change-password", authenticate, authController.changePassword);

// GET /api/auth/me — Lấy thông tin user hiện tại
router.get("/me", authenticate, authController.getMe);

export default router;
